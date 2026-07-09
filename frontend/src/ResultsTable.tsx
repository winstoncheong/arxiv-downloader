import { useCallback, useEffect, useRef, useState } from 'react';
import katex from 'katex';
import type { Paper } from './types';
import 'katex/dist/katex.min.css';

interface Props {
  papers: Paper[];
}

function renderLatex(text: string): string {
  let html = text;
  html = html.replace(/\$\$(.+?)\$\$/gs, (_, math) => {
    try { return katex.renderToString(math, { displayMode: true, throwOnError: false }); }
    catch { return _; }
  });
  html = html.replace(/\$(.+?)\$/g, (_, math) => {
    try { return katex.renderToString(math, { throwOnError: false }); }
    catch { return _; }
  });
  return html;
}

export default function ResultsTable({ papers }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelWidth, setPanelWidth] = useState(420);
  const dragging = useRef(false);

  const selectedPaper = papers.find((p) => p.id === selectedId);

  const onMouseDown = useCallback(() => { dragging.current = true; }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPanelWidth((prev) => Math.max(280, Math.min(800, prev - e.movementX)));
    };
    const onMouseUp = () => { dragging.current = false; };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

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
    <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ ...headerStyle, width: 130 }}>ID</th>
              <th style={headerStyle}>Title</th>
              <th style={{ ...headerStyle, width: 170 }}>Authors</th>
              <th style={{ ...headerStyle, width: 95 }}>Category</th>
              <th style={{ ...headerStyle, width: 75 }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {papers.map((p) => {
              const submitted = p.entry_id?.match(/(\d{4})(\d{2})/)?.[0] || '';
              const authors = p.authors.map((a) => a.split(' ').pop()).join(', ');
              const selected = p.id === selectedId;
              return (
                <tr
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  style={{ cursor: 'pointer', background: selected ? '#eef6ff' : undefined }}
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
      </div>

      <div
        onMouseDown={onMouseDown}
        style={{
          width: 5,
          cursor: 'col-resize',
          background: '#ddd',
          flexShrink: 0,
          alignSelf: 'stretch',
        }}
      />

      <div
        style={{
          width: selectedPaper ? panelWidth : 0,
          minWidth: selectedPaper ? 280 : 0,
          overflowY: 'auto',
          borderLeft: '1px solid #ccc',
          padding: selectedPaper ? '10px 14px' : 0,
          fontSize: 13,
          lineHeight: 1.5,
          maxHeight: '80vh',
          transition: selectedPaper ? undefined : 'width 0.15s',
        }}
      >
        {selectedPaper && (
          <>
            <h2 style={{ fontSize: 15, margin: '0 0 6px' }}>{selectedPaper.title}</h2>
            <p style={{ margin: '0 0 8px', color: '#555' }}>
              {selectedPaper.authors.join(', ')} &middot; {selectedPaper.primary_category}
            </p>
            <div
              dangerouslySetInnerHTML={{ __html: renderLatex(selectedPaper.summary) }}
            />
            <p style={{ marginTop: 10 }}>
              <a href={`https://arxiv.org/abs/${selectedPaper.id}`} target="_blank" rel="noreferrer">
                arxiv.org/abs/{selectedPaper.id}
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}