import { useState } from 'react';
import type { Paper } from './types';

interface Props {
  papers: Paper[];
}

export default function ResultsTable({ papers }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const cellStyle: React.CSSProperties = {
    padding: '4px 10px',
    borderBottom: '1px solid #ddd',
    fontSize: 13,
    verticalAlign: 'top',
  };

  const headerStyle: React.CSSProperties = {
    ...cellStyle,
    fontWeight: 600,
    borderBottom: '2px solid #999',
    position: 'sticky',
    top: 0,
    background: '#fff',
  };

  return (
    <div style={{ position: 'relative' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th style={{ ...headerStyle, width: 140 }}>ID</th>
            <th style={headerStyle}>Title</th>
            <th style={{ ...headerStyle, width: 180 }}>Authors</th>
            <th style={{ ...headerStyle, width: 100 }}>Category</th>
            <th style={{ ...headerStyle, width: 80 }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {papers.map((p) => {
            const submitted = p.entry_id?.match(/(\d{4})(\d{2})/)?.[0] || '';
            const authors = p.authors.map((a) => a.split(' ').pop()).join(', ');
            return (
              <tr
                key={p.id}
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <td style={cellStyle}>
                  <a href={`https://arxiv.org/abs/${p.id}`} target="_blank" rel="noreferrer">
                    {p.id}
                  </a>
                </td>
                <td style={cellStyle}>{p.title}</td>
                <td style={{ ...cellStyle, fontSize: 12 }}>{authors}</td>
                <td style={cellStyle}>{p.primary_category}</td>
                <td style={cellStyle}>{submitted}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {hoveredId && (() => {
        const paper = papers.find((p) => p.id === hoveredId);
        if (!paper) return null;
        return (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#f8f9fa',
            borderTop: '2px solid #ccc',
            padding: '12px 20px',
            maxHeight: 180,
            overflowY: 'auto',
            fontSize: 13,
            lineHeight: 1.5,
            zIndex: 100,
          }}>
            <strong>{paper.title}</strong><br />
            <em>{paper.authors.join(', ')}</em>
            <p style={{ margin: '4px 0 0' }}>{paper.summary.slice(0, 500)}{paper.summary.length > 500 ? '…' : ''}</p>
          </div>
        );
      })()}
    </div>
  );
}