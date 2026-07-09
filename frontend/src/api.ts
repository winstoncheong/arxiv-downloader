import type { SearchResponse } from './types';

export async function searchPapers(params: Record<string, string | number>): Promise<SearchResponse> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== '' && v !== undefined) qs.set(k, String(v));
  }
  const res = await fetch(`/api/search?${qs}`);
  if (!res.ok) throw new Error(`search failed: ${res.statusText}`);
  return res.json();
}