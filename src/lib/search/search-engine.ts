import { getRawClient } from '../db';
import { queryCache } from '../cache/lru-cache';
import {
  SearchQueryRequest,
  SearchQueryResponse,
  FilterCondition,
  SortCondition,
  DatasetRecord,
} from '@/types';
import crypto from 'crypto';

export class SearchEngine {
  /**
   * Generates a deterministic hash for caching search queries
   */
  public static generateQueryHash(request: SearchQueryRequest): string {
    const keyPayload = {
      datasetId: request.datasetId,
      search: (request.search || '').trim().toLowerCase(),
      searchType: request.searchType || 'hybrid',
      searchField: request.searchField || '',
      filters: (request.filters || []).map((f) => ({
        field: f.field,
        operator: f.operator,
        value: f.value,
        valueTo: f.valueTo,
      })),
      filterLogicalOperator: request.filterLogicalOperator || 'AND',
      sort: request.sort || [],
      page: request.page || 1,
      pageSize: request.pageSize || 25,
      cursor: request.cursor || null,
      paginationType: request.paginationType || 'offset',
    };
    return crypto.createHash('md5').update(JSON.stringify(keyPayload)).digest('hex');
  }

  /**
   * Executes an optimized search & filter query over the dataset records
   */
  public static async executeQuery(request: SearchQueryRequest): Promise<SearchQueryResponse> {
    const startTime = performance.now();
    const queryHash = this.generateQueryHash(request);
    const cacheKey = `dataset:${request.datasetId}:${queryHash}`;

    // 1. Check LRU Cache
    const cachedResult = queryCache.get(cacheKey);
    if (cachedResult) {
      const execTime = Math.round((performance.now() - startTime) * 10) / 10;
      this.logPerformanceMetric({
        endpoint: '/api/datasets/[id]/records',
        queryType: request.search ? (request.searchType || 'hybrid') : 'indexed_filter',
        queryHash,
        executionTimeMs: execTime,
        totalRecordsScanned: cachedResult.totalRecords,
        cacheHit: true,
      }).catch(() => {});
      return {
        ...cachedResult,
        executionTimeMs: execTime,
        cacheHit: true,
      };
    }

    const client = await getRawClient();
    const datasetId = request.datasetId;
    const page = Math.max(1, request.page || 1);
    const pageSize = Math.min(200, Math.max(5, request.pageSize || 25));
    const offset = (page - 1) * pageSize;
    const search = (request.search || '').trim();
    const searchType = request.searchType || 'hybrid';
    const filters = request.filters || [];
    const filterLogicalOp = request.filterLogicalOperator || 'AND';
    const sort = request.sort && request.sort.length > 0 ? request.sort : [{ field: 'recordDate', direction: 'desc' }];

    const whereClauses: string[] = ['dataset_id = $1'];
    const params: any[] = [datasetId];
    let paramIndex = 2;

    // 2. Build Search Clause (FTS, Trigram, or Exact)
    let searchRankSelect = '1.0 AS search_relevance';
    let searchOrderBy = '';

    if (search) {
      if (request.searchField) {
        // Field-specific search
        const dbField = this.mapFieldToDbColumn(request.searchField);
        whereClauses.push(`${dbField} ILIKE $${paramIndex}`);
        params.push(`%${search}%`);
        paramIndex++;
      } else {
        // Global search across multiple search strategies
        switch (searchType) {
          case 'fts': {
            // PostgreSQL Full-Text Search using to_tsvector & plainto_tsquery
            whereClauses.push(
              `to_tsvector('english', title || ' ' || category || ' ' || country || ' ' || record_key) @@ plainto_tsquery('english', $${paramIndex})`
            );
            searchRankSelect = `ts_rank(to_tsvector('english', title || ' ' || category || ' ' || country || ' ' || record_key), plainto_tsquery('english', $${paramIndex})) AS search_relevance`;
            searchOrderBy = 'search_relevance DESC, ';
            params.push(search);
            paramIndex++;
            break;
          }
          case 'trgm': {
            // Trigram similarity search (fuzzy matching)
            whereClauses.push(
              `(title % $${paramIndex} OR category % $${paramIndex} OR country % $${paramIndex} OR title ILIKE $${paramIndex + 1})`
            );
            searchRankSelect = `greatest(similarity(title, $${paramIndex}), similarity(category, $${paramIndex}), similarity(country, $${paramIndex})) AS search_relevance`;
            searchOrderBy = 'search_relevance DESC, ';
            params.push(search);
            params.push(`%${search}%`);
            paramIndex += 2;
            break;
          }
          case 'exact': {
            // Substring ILIKE
            whereClauses.push(
              `(title ILIKE $${paramIndex} OR record_key ILIKE $${paramIndex} OR category ILIKE $${paramIndex} OR country ILIKE $${paramIndex})`
            );
            params.push(`%${search}%`);
            paramIndex++;
            break;
          }
          case 'hybrid':
          default: {
            // Hybrid Strategy: Matches Full-Text OR ILIKE substring OR Trigram
            whereClauses.push(
              `(
                to_tsvector('english', title || ' ' || category || ' ' || country || ' ' || record_key) @@ plainto_tsquery('english', $${paramIndex})
                OR title ILIKE $${paramIndex + 1}
                OR record_key ILIKE $${paramIndex + 1}
                OR country ILIKE $${paramIndex + 1}
              )`
            );
            searchRankSelect = `
              (ts_rank(to_tsvector('english', title || ' ' || category || ' ' || country || ' ' || record_key), plainto_tsquery('english', $${paramIndex})) * 2.0
              + CASE WHEN title ILIKE $${paramIndex + 1} THEN 1.0 ELSE 0.0 END) AS search_relevance
            `;
            searchOrderBy = 'search_relevance DESC, ';
            params.push(search);
            params.push(`%${search}%`);
            paramIndex += 2;
            break;
          }
        }
      }
    }

    // 3. Dynamic Filter Conditions (Date range, numeric range, exact, contains, status, etc.)
    if (filters.length > 0) {
      const filterSubClauses: string[] = [];

      for (const filter of filters) {
        const dbColumn = this.mapFieldToDbColumn(filter.field);
        const { clause, newParams, nextIndex } = this.buildFilterClause(dbColumn, filter, paramIndex);
        if (clause) {
          filterSubClauses.push(clause);
          params.push(...newParams);
          paramIndex = nextIndex;
        }
      }

      if (filterSubClauses.length > 0) {
        whereClauses.push(`(${filterSubClauses.join(` ${filterLogicalOp} `)})`);
      }
    }

    const whereSql = whereClauses.join(' AND ');

    // 4. Multi-Column Sorting
    const sortClauses: string[] = [];
    for (const s of sort) {
      const dbCol = this.mapFieldToDbColumn(s.field);
      const dir = s.direction.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
      sortClauses.push(`${dbCol} ${dir}`);
    }
    const sortSql = sortClauses.length > 0 ? sortClauses.join(', ') : 'record_date DESC';

    // 5. Data Fetch Query with Pagination
    let recordsSql: string;
    let queryParams: any[];

    if (request.paginationType === 'cursor' && request.cursor) {
      // Cursor Pagination optimization for infinite scrolling / deep pages
      const cursorObj = JSON.parse(Buffer.from(request.cursor, 'base64').toString('utf-8'));
      const cursorParamIdx = paramIndex;
      const cursorWhere = `${whereSql} AND (record_date, id) < ($${cursorParamIdx}, $${cursorParamIdx + 1})`;
      queryParams = [...params, new Date(cursorObj.recordDate), cursorObj.id, pageSize];
      recordsSql = `
        SELECT 
          id, dataset_id, record_key, title, category, status, numeric_value, country, region, record_date, metadata, created_at, updated_at,
          ${searchRankSelect}
        FROM dataset_records
        WHERE ${cursorWhere}
        ORDER BY record_date DESC, id DESC
        LIMIT $${cursorParamIdx + 2};
      `;
    } else {
      // Offset Pagination (standard jump to page)
      queryParams = [...params, pageSize, offset];
      recordsSql = `
        SELECT 
          id, dataset_id, record_key, title, category, status, numeric_value, country, region, record_date, metadata, created_at, updated_at,
          ${searchRankSelect}
        FROM dataset_records
        WHERE ${whereSql}
        ORDER BY ${searchOrderBy}${sortSql}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
      `;
    }

    const countSql = `SELECT COUNT(*)::int AS total FROM dataset_records WHERE ${whereSql};`;

    // 6. Execute count and records query concurrently for optimal response time
    const [countResult, recordsRes] = await Promise.all([
      (async () => {
        if (!search && filters.length === 0) {
          try {
            const dsRes = await client.query('SELECT total_records FROM datasets WHERE id = $1', [datasetId]);
            if (dsRes.rows && dsRes.rows[0] && dsRes.rows[0].total_records != null) {
              return Number(dsRes.rows[0].total_records);
            }
          } catch (_) {}
        }
        const countRes = await client.query(countSql, params);
        return countRes.rows && countRes.rows[0] ? Number(countRes.rows[0].total) : 0;
      })(),
      client.query(recordsSql, queryParams),
    ]);

    const totalRecords = countResult;
    const rawRows = recordsRes.rows || [];

    const records: DatasetRecord[] = rawRows.map((r: any) => ({
      id: r.id,
      datasetId: r.dataset_id,
      recordKey: r.record_key,
      title: r.title,
      category: r.category,
      status: r.status,
      numericValue: parseFloat(r.numeric_value),
      country: r.country,
      region: r.region,
      recordDate: r.record_date instanceof Date ? r.record_date.toISOString() : r.record_date,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata || {},
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
      updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
    }));

    const totalPages = Math.ceil(totalRecords / pageSize);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    let nextCursor: string | undefined;
    if (records.length > 0) {
      const lastRec = records[records.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({ id: lastRec.id, recordDate: lastRec.recordDate })
      ).toString('base64');
    }

    const executionTimeMs = Math.round((performance.now() - startTime) * 10) / 10;

    const response: SearchQueryResponse = {
      records,
      totalRecords,
      page,
      pageSize,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextCursor,
      executionTimeMs,
      cacheHit: false,
      searchStrategyUsed: search ? searchType : 'direct_indexed',
      appliedFiltersCount: filters.length + (search ? 1 : 0),
      timestamp: new Date().toISOString(),
    };

    // Save to LRU Cache
    queryCache.set(cacheKey, response);

    // Asynchronously log performance metrics without blocking response
    this.logPerformanceMetric({
      endpoint: '/api/datasets/[id]/records',
      queryType: search ? searchType : 'indexed_filter',
      queryHash,
      executionTimeMs,
      totalRecordsScanned: totalRecords,
      cacheHit: false,
    }).catch(() => {});

    return response;
  }

  private static mapFieldToDbColumn(field: string): string {
    const map: Record<string, string> = {
      id: 'id',
      datasetId: 'dataset_id',
      recordKey: 'record_key',
      title: 'title',
      category: 'category',
      status: 'status',
      numericValue: 'numeric_value',
      country: 'country',
      region: 'region',
      recordDate: 'record_date',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    };
    return map[field] || `metadata->>'${field}'`;
  }

  private static buildFilterClause(
    dbColumn: string,
    filter: FilterCondition,
    paramIndex: number
  ): { clause: string; newParams: any[]; nextIndex: number } {
    const isJsonField = dbColumn.startsWith('metadata');
    const colExpr = isJsonField ? dbColumn : dbColumn;

    switch (filter.operator) {
      case 'equals':
        return {
          clause: `${colExpr} = $${paramIndex}`,
          newParams: [filter.value],
          nextIndex: paramIndex + 1,
        };
      case 'contains':
        return {
          clause: `${colExpr} ILIKE $${paramIndex}`,
          newParams: [`%${filter.value}%`],
          nextIndex: paramIndex + 1,
        };
      case 'starts_with':
        return {
          clause: `${colExpr} ILIKE $${paramIndex}`,
          newParams: [`${filter.value}%`],
          nextIndex: paramIndex + 1,
        };
      case 'greater_than':
        return {
          clause: `${colExpr} > $${paramIndex}`,
          newParams: [filter.value],
          nextIndex: paramIndex + 1,
        };
      case 'less_than':
        return {
          clause: `${colExpr} < $${paramIndex}`,
          newParams: [filter.value],
          nextIndex: paramIndex + 1,
        };
      case 'between':
        return {
          clause: `${colExpr} BETWEEN $${paramIndex} AND $${paramIndex + 1}`,
          newParams: [filter.value, filter.valueTo],
          nextIndex: paramIndex + 2,
        };
      case 'in': {
        const values = Array.isArray(filter.value) ? filter.value : [filter.value];
        const placeholders = values.map((_, i) => `$${paramIndex + i}`).join(', ');
        return {
          clause: `${colExpr} IN (${placeholders})`,
          newParams: values,
          nextIndex: paramIndex + values.length,
        };
      }
      case 'is_null':
        return {
          clause: `${colExpr} IS NULL`,
          newParams: [],
          nextIndex: paramIndex,
        };
      case 'is_not_null':
        return {
          clause: `${colExpr} IS NOT NULL`,
          newParams: [],
          nextIndex: paramIndex,
        };
      default:
        return { clause: '', newParams: [], nextIndex: paramIndex };
    }
  }

  private static async logPerformanceMetric(metric: {
    endpoint: string;
    queryType: string;
    queryHash: string;
    executionTimeMs: number;
    totalRecordsScanned: number;
    cacheHit: boolean;
  }) {
    try {
      const client = await getRawClient();
      await client.query(
        `INSERT INTO query_performance_logs (id, endpoint, query_type, query_hash, execution_time_ms, total_records_scanned, cache_hit)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          crypto.randomUUID(),
          metric.endpoint,
          metric.queryType,
          metric.queryHash,
          metric.executionTimeMs,
          metric.totalRecordsScanned,
          metric.cacheHit,
        ]
      );
    } catch (e) {
      // Don't fail the primary query if log fails
    }
  }
}

