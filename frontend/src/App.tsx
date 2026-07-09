import { useState } from 'react';
import SearchBar from './SearchBar';
import ResultsTable from './ResultsTable';
import { searchPapers } from './api';
import type { Paper, SearchResponse } from './types';

export default function App() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  const handleSearch = async (params: Record<string, string | number>) => {
    setLoading(true);
    setError('');
    try {
      const data: SearchResponse = await searchPapers(params);
      setPapers(data.papers);
      setTotal(data.total);
    } catch (e) {
      setError(String(e));
      setPapers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 20, margin: '0 0 12px' }}>arxiv-downloader</h1>
      <SearchBar onSearch={handleSearch} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <p>Searching…</p>}
      {!loading && papers.length > 0 && (
        <>
          <p style={{ fontSize: 13, color: '#666', margin: '0 0 8px' }}>Showing {papers.length} of {total} results</p>
          <ResultsTable papers={papers} />
        </>
      )}
    </div>
  );
}