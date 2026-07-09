import argparse
import json
import sys
import webbrowser

from . import __version__
from .downloader import download_papers, fetch_papers_metadata, search_papers


def cmd_download(args):
    output_dir = args.output_dir or '.'
    if args.json:
        papers = fetch_papers_metadata(args.ids)
        print(json.dumps(papers, indent=2))
    else:
        download_papers(args.ids, output_dir=output_dir)


def cmd_search(args):
    if args.query:
        q = args.query
    else:
        parts = []
        if args.author:
            parts.append(f"au:{args.author}")
        if args.title:
            parts.append(f"ti:{args.title}")
        if args.category:
            parts.append(f"cat:{args.category}")
        q = " AND ".join(parts) if parts else "all:electron"
    papers = search_papers(q, max_results=args.max_results, sort_by=args.sort_by, sort_order=args.sort_order)

    if args.json:
        print(json.dumps(papers, indent=2))
    else:
        for p in papers:
            authors = ", ".join(a.split()[-1] for a in p["authors"][:5])
            print(f'{p["id"]}  {p["title"][:70]:70s}  {authors:30s}  {p["primary_category"]:10s}')


def cmd_serve(args):
    try:
        from .server import app
        import uvicorn
    except ImportError:
        print("error: 'serve' requires fastapi and uvicorn. Install with: pip install 'arxiv-downloader[web]'", file=sys.stderr)
        sys.exit(1)

    port = args.port
    url = f"http://localhost:{port}"
    webbrowser.open(url)

    frontend_dir = __import__('pathlib').Path(__file__).resolve().parent.parent / "frontend" / "dist"
    if not frontend_dir.is_dir():
        print(f"warning: frontend not built at {frontend_dir}. Run: cd frontend && npm install && npm run build", file=sys.stderr)

    print(f"server running at {url}", file=sys.stderr)
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")


def main():
    parser = argparse.ArgumentParser(
        description="Search and download papers from arXiv.",
    )
    parser.add_argument('--version', action='version', version=f'%(prog)s {__version__}')

    sub = parser.add_subparsers(dest='command')

    d = sub.add_parser('download', help='Download papers by ID')
    d.add_argument('ids', nargs='+', metavar='ID', help='arXiv paper ID(s)')
    d.add_argument('--output-dir', default=None, help='Output directory (default: current)')
    d.add_argument('-i', '--interactive', action='store_true', help='Interactive REPL mode')
    d.add_argument('--json', action='store_true', help='Output metadata as JSON (skips downloads)')
    d.set_defaults(func=cmd_download)

    s = sub.add_parser('search', help='Search arXiv papers')
    s.add_argument('query', nargs='?', default='', help='Free-form search query')
    s.add_argument('--author', default='', help='Filter by author')
    s.add_argument('--title', default='', help='Filter by title')
    s.add_argument('--category', default='', help='Filter by category (e.g. math.NT)')
    s.add_argument('--max-results', type=int, default=25, help='Max results (default: 25)')
    s.add_argument('--sort-by', choices=['relevance', 'submitted_date', 'updated_date'], default='relevance')
    s.add_argument('--sort-order', choices=['ascending', 'descending'], default='descending')
    s.add_argument('--json', action='store_true', help='Output as JSON')
    s.set_defaults(func=cmd_search)

    sv = sub.add_parser('serve', help='Start the web UI')
    sv.add_argument('--port', type=int, default=8080, help='Port (default: 8080)')
    sv.set_defaults(func=cmd_serve)

    for p in [d, s, sv]:
        p.add_argument('--version', action='version', version=f'%(prog)s {__version__}')

    args = parser.parse_args()

    if args.command is None:
        parser.print_help()
        sys.exit(1)

    args.func(args)


if __name__ == '__main__':
    main()