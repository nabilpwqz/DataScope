import React from 'react';

interface SearchHighlighterProps {
  text: string | number | null | undefined;
  searchQuery?: string;
  enabled?: boolean;
}

export const SearchHighlighter: React.FC<SearchHighlighterProps> = ({
  text,
  searchQuery,
  enabled = true,
}) => {
  if (text === null || text === undefined) return <span>-</span>;
  const str = String(text);

  if (!enabled || !searchQuery || !searchQuery.trim()) {
    return <span>{str}</span>;
  }

  const query = searchQuery.trim();
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = str.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="highlight-match">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

