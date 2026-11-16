import { useGetDatasetsQuery, useGetDatasetByIdQuery } from '@/store/services/dataScopeApi';

export function useDatasetsList() {
  return useGetDatasetsQuery();
}

export function useDatasetDetail(datasetId: string) {
  return useGetDatasetByIdQuery(datasetId, { skip: !datasetId });
}

