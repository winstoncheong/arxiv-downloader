export interface Paper {
  id: string;
  entry_id: string;
  title: string;
  authors: string[];
  summary: string;
  comment: string | null;
  journal_ref: string | null;
  doi: string | null;
  primary_category: string;
  categories: string[];
  pdf_url: string;
  links: string[];
}

export interface SearchResponse {
  papers: Paper[];
  total: number;
}