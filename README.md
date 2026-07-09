# arxiv-downloader

Search and download papers from arXiv. Provides a CLI for downloading papers by ID, searching with arXiv query syntax, and a local web UI for browsing results.

## Install

```sh
pip install .
pip install '.[web]'   # with web UI support
```

Using uv:

```sh
uv tool install .
uv tool install '.[web]'   # with web UI support
```

## Usage

```
arxiv-download <command> [options]
```

### Commands

| Command | Description |
|---------|-------------|
| `download <IDs...>` | Download papers by arXiv ID |
| `search [query]` | Search arXiv papers |
| `serve` | Start the web UI |

### Download papers

```sh
arxiv-download download 2607.01544
arxiv-download download 2607.01544 2607.01545 --output-dir ./papers
arxiv-download download 2607.01544 --json   # metadata as JSON, skips download
```

Options:

| Flag | Description |
|------|-------------|
| `--output-dir DIR` | Output directory (default: current) |
| `-i, --interactive` | Interactive REPL mode |
| `--json` | Output JSON, skip download |

### Search

```sh
arxiv-download search "au:ono AND cat:math.NT" --max-results 10
arxiv-download search --author "Ken Ono" --category math.NT
arxiv-download search "quantum" --json | jq '.papers[].title'
```

Options:

| Flag | Description |
|------|-------------|
| `query` | Free-form arXiv query string |
| `--author TEXT` | Filter by author |
| `--title TEXT` | Filter by title |
| `--category TEXT` | Filter by category (e.g. math.NT, cs.LG) |
| `--max-results N` | Max results (default: 25) |
| `--sort-by {relevance,submitted_date,updated_date}` | Sort field |
| `--json` | Output as JSON |

When `query` is provided, it is passed directly to the arXiv API as-is. The structured flags (`--author`, `--title`, `--category`) are only used when `query` is empty.

### Web UI

```sh
cd frontend && npm install && npm run build   # one-time setup
arxiv-download serve
```

Opens a browser at `http://localhost:8080` with:

- Free-form search input
- Advanced fields: author, title, category, max results
- Compact table with columns: ID, Title, Authors, Category, Date
- Abstract shown on row hover

## Query syntax

arXiv supports field-prefixed search queries. Common prefixes:

| Prefix | Example |
|--------|---------|
| `au:` | `au:ono` |
| `ti:` | `ti:modular forms` |
| `abs:` | `abs:quantum` |
| `cat:` | `cat:math.NT` |
| `all:` | `all:electron transport` |

Combine with `AND`, `OR`, `ANDNOT`. See the [arXiv API User Manual](https://info.arxiv.org/help/api/user-manual.html) for full details.