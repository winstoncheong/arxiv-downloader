import { useState } from 'react';

interface SearchBarProps {
  onSearch: (params: Record<string, string | number>) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [author, setAuthor] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [maxResults, setMaxResults] = useState(25);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ query, author, title, category, max_results: maxResults });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="Free-form query (e.g. au:del_maestro AND ti:checkerboard)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, padding: '6px 10px' }}
        />
        <button type="submit">Search</button>
        <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}>
          {showAdvanced ? 'Hide' : 'Advanced'}
        </button>
      </div>
      {showAdvanced && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <input placeholder="Author" value={author} onChange={(e) => setAuthor(e.target.value)} style={{ padding: '4px 8px' }} />
          <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ padding: '4px 8px' }} />
          <input placeholder="Category (e.g. math.NT)" value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '4px 8px' }} />
          <input type="number" placeholder="Max results" value={maxResults} onChange={(e) => setMaxResults(Number(e.target.value))} style={{ padding: '4px 8px', width: 100 }} />
        </div>
      )}
    </form>
  );
}