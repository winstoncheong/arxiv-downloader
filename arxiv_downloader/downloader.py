import sys

import arxiv
import gzip
import io
import os
import shutil
import tarfile

import requests

from .utils import make_authors_string, sanitize_filename


def download_file(url, filename):
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        with open(filename, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
    return filename


def unzip_gz_file(input_file, output_file):
    with gzip.open(input_file, 'rb') as f_in:
        with io.open(output_file, 'wb') as f_out:
            f_out.write(f_in.read())


def _paper_to_dict(result):
    return {
        'id': result.get_short_id(),
        'entry_id': result.entry_id,
        'title': result.title,
        'authors': [author.name for author in result.authors],
        'summary': result.summary,
        'comment': result.comment,
        'journal_ref': result.journal_ref,
        'doi': result.doi,
        'primary_category': str(result.primary_category),
        'categories': result.categories,
        'pdf_url': result.pdf_url,
        'links': [link.href for link in result.links],
    }


def fetch_papers_metadata(id_list):
    return [_paper_to_dict(r) for r in arxiv.Client().results(arxiv.Search(id_list=id_list))]


def search_papers(query, max_results=25, start=0, sort_by=None, sort_order=None):
    sort_by_map = {
        'relevance': arxiv.SortCriterion.Relevance,
        'submitted_date': arxiv.SortCriterion.SubmittedDate,
        'updated_date': arxiv.SortCriterion.LastUpdatedDate,
    }
    sort_order_map = {
        'ascending': arxiv.SortOrder.Ascending,
        'descending': arxiv.SortOrder.Descending,
    }
    kwargs = dict(query=query, max_results=max_results)
    if sort_by:
        kwargs['sort_by'] = sort_by_map[sort_by]
    if sort_order:
        kwargs['sort_order'] = sort_order_map[sort_order]
    return [_paper_to_dict(r) for r in arxiv.Client().results(arxiv.Search(**kwargs))]


def download_papers(id_list, output_dir="."):
    search = arxiv.Search(id_list=id_list)

    for result in arxiv.Client().results(search):
        print(f'\n{result.get_short_id()}: {result.title}', file=sys.stderr)

        pdf_url = next((link.href for link in result.links if 'pdf' in link.href), None)
        arxiv_id = result.get_short_id().replace('/', '_')

        if pdf_url:
            download_file(pdf_url, os.path.join(output_dir, f"{arxiv_id}.pdf"))

        if not result.entry_id:
            continue

        source_url = result.entry_id.replace("http://arxiv.org/abs/", "https://arxiv.org/src/")
        source_path = download_file(source_url, os.path.join(output_dir, f"{arxiv_id}.tar.gz"))

        authors_str = make_authors_string(result.authors)
        title_str = sanitize_filename(result.title)
        paper_dir = os.path.join(output_dir, f"{arxiv_id}-{authors_str}-{title_str}")

        tar_path = source_path[:-3]
        unzip_gz_file(source_path, tar_path)

        if tarfile.is_tarfile(tar_path):
            os.makedirs(paper_dir, exist_ok=True)
            with tarfile.open(tar_path, 'r') as tar:
                tar.extractall(paper_dir)
        else:
            renamed_path = tar_path[:-4] + ".tex"
            shutil.move(tar_path, renamed_path)
            os.makedirs(paper_dir, exist_ok=True)
            try:
                shutil.move(renamed_path, paper_dir)
            except Exception:
                pass

        os.remove(source_path)
        if os.path.exists(tar_path):
            os.remove(tar_path)

        print(f'  -> {paper_dir}', file=sys.stderr)
