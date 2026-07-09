import { useCallback, useEffect, useState } from 'react';
import SearchBar from './SearchBar';
import ResultsTable from './ResultsTable';
import { searchPapers } from './api';
import type { Paper, SearchResponse } from './types';

const CACHE_KEY = 'arxiv-downloader-cache';
const DIR_KEY = 'arxiv-downloader-dir';

function loadCache(): { params: Record<string, string | number>; papers: Paper[] } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveCache(params: Record<string, string | number>, papers: Paper[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ params, papers }));
  } catch { /* quota exceeded, ignore */ }
}

export default function App() {
  const cache = loadCache();
  const [papers, setPapers] = useState<Paper[]>(cache?.papers ?? []);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [downloadDir, setDownloadDir] = useState(() => localStorage.getItem(DIR_KEY) || 'test');

  const handleSearch = useCallback(async (params: Record<string, string | number>) => {
    setLoading(true);
    setError('');
    try {
      const data: SearchResponse = await searchPapers(params);
      setPapers(data.papers);
      setTotal(data.total);
      saveCache(params, data.papers);
    } catch (e) {
      setError(String(e));
      setPapers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cache?.params && cache.papers.length > 0) {
      setTotal(cache.papers.length);
    }
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>arxiv-downloader</h1>
        <label style={{ fontSize: 13, color: '#555', display: 'flex', alignItems: 'center', gap: 4 }}>
          Download to:
          <input
            value={downloadDir}
            onChange={(e) => { setDownloadDir(e.target.value); localStorage.setItem(DIR_KEY, e.target.value); }}
            style={{ width: 180, fontSize: 12, padding: '2px 6px' }}
          />
        </label>
      </div>
      <SearchBar initialParams={cache?.params} onSearch={handleSearch} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <p>Searching…</p>}
      {!loading && papers.length > 0 && (
        <>
          <p style={{ fontSize: 13, color: '#666', margin: '0 0 8px' }}>
            {cache && 'Restored '}Showing {papers.length} of {total} results
          </p>
          <ResultsTable papers={papers} downloadDir={downloadDir} />
        </>
      )}
    </div>
  );
}