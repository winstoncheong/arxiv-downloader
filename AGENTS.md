# arxiv-downloader

CLI tool to search and download papers from arXiv.

## Project structure

```
pyproject.toml             # packaging, deps, entry point
arxiv_downloader/
├── __init__.py            # version
├── __main__.py            # python -m support
├── cli.py                 # argparse: subcommands download/search/serve
├── downloader.py          # download + search + metadata logic
├── utils.py               # sanitize_filename, make_authors_string
└── server.py              # FastAPI backend for web UI
frontend/                  # React + Vite + TypeScript
├── package.json, tsconfig.json, vite.config.ts
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── SearchBar.tsx
    ├── ResultsTable.tsx
    ├── api.ts
    └── types.ts
```

## CLI entry points

- `arxiv-download download <IDs...>` — download papers (--output-dir, -i, --json)
- `arxiv-download search [query]` — search (--author, --title, --category, --max-results, --sort-by, --sort-order, --json)
- `arxiv-download serve` — start web UI (--port)

The entry point is `arxiv_downloader.cli:main`, registered in pyproject.toml under `[project.scripts]`.

## Dependencies

- **Runtime**: `arxiv>=2.1`, `requests>=2.31`
- **Optional (web):** `fastapi>=0.115`, `uvicorn>=0.34`
- **Frontend:** React 18, Vite 6, TypeScript 5.6 (npm, in frontend/)

Install web extras with `pip install '.[web]'`.

## Tests

```sh
python -m pytest test_sanitize.py
```

Tests are in `test_sanitize.py` at the project root.

## Web UI

The frontend is a static SPA built with Vite. `npm run build` outputs to `frontend/dist/`. The FastAPI server mounts `/assets` and serves `index.html` for all non-API routes.

## Key design decisions

- Search uses the `arxiv` PyPI package (`arxiv.Search`, `arxiv.Client().results()`)
- `download` command preserves original download+extract behavior
- `search` command passes the query string directly to arXiv when provided; otherwise builds from structured flags
- `--json` flag on download/search outputs JSON array to stdout
- Server logs go to stderr; JSON output goes to stdout (pipe-friendly)
- Query syntax uses the standard arXiv API: `au:`, `ti:`, `abs:`, `cat:`, `all:` prefixes with `AND`/`OR`/`ANDNOT`