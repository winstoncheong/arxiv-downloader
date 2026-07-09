from pathlib import Path

import requests
from fastapi import FastAPI, Query
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from .downloader import fetch_papers_metadata, search_papers

app = FastAPI(title="arxiv-downloader")

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"


@app.get("/api/search")
def search(
    query: str = Query(""),
    author: str = Query(""),
    title: str = Query(""),
    category: str = Query(""),
    max_results: int = Query(25, ge=1, le=500),
    start: int = Query(0, ge=0),
    sort_by: str = Query("relevance"),
    sort_order: str = Query("descending"),
    id_list: str = Query(""),
):
    if id_list:
        papers = fetch_papers_metadata(id_list.split(","))
        return {"papers": papers, "total": len(papers)}

    if query:
        q = query
    else:
        parts = []
        if author:
            parts.append(f"au:{author}")
        if title:
            parts.append(f"ti:{title}")
        if category:
            parts.append(f"cat:{category}")
        q = " AND ".join(parts) if parts else "all:electron"
    papers = search_papers(q, max_results=max_results, start=start, sort_by=sort_by, sort_order=sort_order)
    return {"papers": papers, "total": len(papers)}


@app.get("/api/download")
def download(arxiv_id: str = Query(...), type: str = Query("pdf")):
    papers = fetch_papers_metadata([arxiv_id])
    if not papers:
        from fastapi.responses import JSONResponse
        return JSONResponse({"error": "paper not found"}, status_code=404)

    paper = papers[0]
    url = paper.get('pdf_url', '')
    if not url:
        pdf_url = next((link for link in paper['links'] if 'pdf' in link), None)
        if pdf_url:
            url = pdf_url

    filename = f"{arxiv_id.replace('/', '_')}.pdf"
    response = requests.get(url, stream=True)
    response.raise_for_status()
    return StreamingResponse(
        response.iter_content(chunk_size=8192),
        media_type='application/pdf',
        headers={'Content-Disposition': f'attachment; filename="{filename}"'},
    )


if FRONTEND_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")

    def _serve_frontend():
        index = FRONTEND_DIR / "index.html"
        if index.exists():
            return FileResponse(str(index))
        from fastapi.responses import JSONResponse
        return JSONResponse({"error": "frontend not built"}, status_code=404)

    @app.get("/")
    def root():
        return _serve_frontend()

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            from fastapi.responses import JSONResponse
            return JSONResponse({"error": "not found"}, status_code=404)
        return _serve_frontend()