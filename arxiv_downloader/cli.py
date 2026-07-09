import argparse
import sys

import json

from . import __version__
from .downloader import download_papers, fetch_papers_metadata


def main():
    parser = argparse.ArgumentParser(
        description="Download papers from arXiv.",
    )
    parser.add_argument(
        'ids',
        nargs='*',
        metavar='ID',
        help='arXiv paper ID(s) to download',
    )
    parser.add_argument(
        '--output-dir',
        default=None,
        help='Base output directory (default: current directory)',
    )
    parser.add_argument(
        '-i', '--interactive',
        action='store_true',
        help='Enter interactive REPL mode',
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output paper metadata as JSON (skips downloads)',
    )
    parser.add_argument(
        '--version',
        action='version',
        version=f'%(prog)s {__version__}',
    )

    args = parser.parse_args()

    output_dir = args.output_dir or '.'

    if args.json:
        if args.ids:
            papers = fetch_papers_metadata(args.ids)
            print(json.dumps(papers, indent=2))
        else:
            parser.error('--json requires paper IDs')
    elif args.interactive or (len(sys.argv) == 1 and not args.ids):
        while True:
            try:
                line = input('Space separated list of ids (or "exit"): ')
            except EOFError:
                break
            if line.strip() == 'exit':
                break
            id_list = line.strip().split()
            if id_list:
                download_papers(id_list, output_dir=output_dir)
    elif args.ids:
        download_papers(args.ids, output_dir=output_dir)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
