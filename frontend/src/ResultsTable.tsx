import { useCallback, useEffect, useRef, useState } from 'react';
import katex from 'katex';
import type { Paper } from './types';
import 'katex/dist/katex.min.css';

interface Props {
  papers: Paper[];
}

function loadMathJax(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).MathJax) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

function renderLatex(text: string): { html: string; fallbackBlocks: string[] } {
  const fallbackBlocks: string[] = [];
  let blockIdx = 0;

  const renderOne = (math: string, display: boolean): string => {
    try {
      return katex.renderToString(math, { displayMode: display, throwOnError: false });
    } catch {
      const id = `mjx-fallback-${blockIdx++}`;
      const delim = display ? '$$' : '$';
      fallbackBlocks.push(delim + math + delim);
      return `<span class="mathjax-fallback" id="${id}">${delim + math + delim}</span>`;
    }
  };

  let html = text;
  html = html.replace(/\$\$(.+?)\$\$/gs, (_, math) => renderOne(math, true));
  html = html.replace(/\$(.+?)\$/g, (_, math) => renderOne(math, false));
  return { html, fallbackBlocks };
}

async function renderAllMathJax() {
  await loadMathJax();
  const mj = (window as any).MathJax;
  if (mj?.typesetPromise) {
    await mj.typesetPromise();
  }
}

export default function ResultsTable({ papers }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [panelWidth, setPanelWidth] = useState(420);
  const [fallbackLatex, setFallbackLatex] = useState<string[]>([]);
  const dragging = useRef(false);
  const rafRef = useRef<number>();

  const activeId = selectedId ?? hoveredId;
  const activePaper = papers.find((p) => p.id === activeId);

  useEffect(() => {
    if (activePaper) {
      const { fallbackBlocks } = renderLatex(activePaper.summary);
      if (fallbackBlocks.length > 0) {
        setFallbackLatex(fallbackBlocks);
      }
    }
  }, [activePaper]);

  useEffect(() => {
    if (fallbackLatex.length > 0) {
      renderAllMathJax().then(() => setFallbackLatex([]));
    }
  }, [fallbackLatex]);

  const onMouseDown = useCallback(() => { dragging.current = true; }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      cancelAnimationFrame(rafRef.current!);
      rafRef.current = requestAnimationFrame(() => {
        setPanelWidth((prev) => Math.max(280, Math.min(800, prev - e.movementX)));
      });
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
              const pinned = p.id === selectedId;
              return (
                <tr
                  key={p.id}
                  onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
                  onMouseEnter={() => !selectedId && setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ cursor: 'pointer', background: pinned ? '#eef6ff' : undefined }}
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
          width: activePaper ? panelWidth : 0,
          minWidth: activePaper ? 280 : 0,
          borderLeft: '1px solid #ccc',
          alignSelf: 'stretch',
          position: 'sticky',
          top: 0,
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          fontSize: 13,
          lineHeight: 1.5,
          transition: activePaper ? undefined : 'width 0.2s',
        }}
      >
        {activePaper && (() => {
          const { html } = renderLatex(activePaper.summary);
          return (
            <>
              <div style={{ padding: '10px 14px 6px', flexShrink: 0, background: '#fff', borderBottom: '1px solid #eee' }}>
                {selectedId && (
                  <button
                    onClick={() => setSelectedId(null)}
                    style={{ float: 'right', border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: '#999' }}
                    title="Unpin"
                  >
                    ✕
                  </button>
                )}
                <h2 style={{ fontSize: 15, margin: 0 }}>{activePaper.title}</h2>
                <p style={{ margin: '4px 0 0', color: '#555' }}>
                  {activePaper.authors.join(', ')} &middot; {activePaper.primary_category}
                </p>
                <p style={{ margin: '2px 0 0' }}>
                  <a href={`https://arxiv.org/abs/${activePaper.id}`} target="_blank" rel="noreferrer">
                    arxiv.org/abs/{activePaper.id}
                  </a>
                </p>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px 14px' }}>
                <div dangerouslySetInnerHTML={{ __html: html }} />
                {!selectedId && (
                  <p style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                    Click a row to pin
                  </p>
                )}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}