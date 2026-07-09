import { useCallback, useEffect, useRef, useState } from 'react';
import katex from 'katex';
import type { Paper } from './types';
import 'katex/dist/katex.min.css';

interface Props {
  papers: Paper[];
  downloadDir: string;
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

export default function ResultsTable({ papers, downloadDir }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(papers[0]?.id ?? null);
  const [panelWidth, setPanelWidth] = useState(420);
  const [fallbackLatex, setFallbackLatex] = useState<string[]>([]);
  const dragging = useRef(false);
  const rafRef = useRef<number>();

  const activePaper = papers.find((p) => p.id === selectedId);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = useCallback(async (arxivId: string) => {
    setDownloading(arxivId);
    try {
      const res = await fetch(`/api/download?arxiv_id=${arxivId}&output_dir=${encodeURIComponent(downloadDir)}`);
      const data = await res.json();
      if (data.status === 'ok') {
        alert(`Downloaded to ${data.path}`);
      } else {
        alert(`Download failed: ${data.message}`);
      }
    } catch (e: any) {
      alert(`Download error: ${e.message}`);
    } finally {
      setDownloading(null);
    }
  }, []);

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

  useEffect(() => {
    if (papers.length > 0 && !papers.find((p) => p.id === selectedId)) {
      setSelectedId(papers[0].id);
    }
  }, [papers]);

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
              <th style={{ ...headerStyle, width: 70 }}>D/L</th>
            </tr>
          </thead>
          <tbody>
            {papers.map((p) => {
              const authors = p.authors.map((a) => a.split(' ').pop()).join(', ');
              const pinned = p.id === selectedId;
              return (
                <tr
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
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
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    {downloading === p.id ? (
                      <span style={{ fontSize: 11, color: '#999' }}>...</span>
                    ) : (
                      <span onClick={(e) => { e.stopPropagation(); handleDownload(p.id); }} style={{ fontSize: 11, color: '#1a73e8', cursor: 'pointer', textDecoration: 'underline' }} title="Download PDF + Source">D/L</span>
                    )}
                  </td>
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
          width: panelWidth,
          minWidth: 280,
          borderLeft: '1px solid #ccc',
          alignSelf: 'stretch',
          position: 'sticky',
          top: 0,
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        {(() => {
          const paper = activePaper!;
          const { html } = renderLatex(paper.summary);
          return (
            <>
              <div style={{ padding: '10px 14px 6px', flexShrink: 0, background: '#fff', borderBottom: '1px solid #eee' }}>
                <h2 style={{ fontSize: 15, margin: 0 }}>{paper.title}</h2>
                <p style={{ margin: '4px 0 0', color: '#555' }}>
                  {paper.authors.join(', ')} &middot; {paper.primary_category}
                </p>
                <p style={{ margin: '2px 0 0' }}>
                  <a href={`https://arxiv.org/abs/${paper.id}`} target="_blank" rel="noreferrer">
                    arxiv.org/abs/{paper.id}
                  </a>
                </p>
                <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                  <button onClick={() => handleDownload(paper.id)} style={{ fontSize: 12, padding: '2px 10px', background: '#e8f0fe', borderRadius: 4, border: 'none', cursor: 'pointer', color: '#1a73e8' }}>
                    {downloading === paper.id ? '...' : 'Download PDF + Source'}
                  </button>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px 14px' }}>
                <div dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}