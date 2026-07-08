import arxiv
import gzip
import io
import os
import shutil
import tarfile

import requests

from .utils import make_authors_string, sanitize_filename


def download_file(url, filename):
    print(f"Downloading {url} to {filename}")
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        with open(filename, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
    return filename


def unzip_gz_file(input_file, output_file):
    print(f'Unzipping {input_file} to {output_file}')
    with gzip.open(input_file, 'rb') as f_in:
        with io.open(output_file, 'wb') as f_out:
            f_out.write(f_in.read())


def download_papers(id_list, output_dir=".", no_prompt=False):
    search = arxiv.Search(id_list=id_list)

    for result in arxiv.Client().results(search):
        print()
        print(f'Downloading {result.get_short_id()}: {result.title}...')

        print('  Entry ID:', result.entry_id)
        print('  Title:', result.title)
        print('  Authors:', [author.name for author in result.authors])
        print('  Summary:', result.summary)
        print('  Comment:', result.comment)
        print('  Journal reference:', result.journal_ref)
        print('  DOI:', result.doi)
        print('  Primary category:', result.primary_category)
        print('  Categories:', result.categories)
        print('  Links:', [link.href for link in result.links])
        print('  PDF:', result.pdf_url)
        print()

        pdf_url = next((link.href for link in result.links if 'pdf' in link.href), None)

        arxiv_id = result.get_short_id().replace('/', '_')

        if pdf_url:
            download_file(pdf_url, os.path.join(output_dir, f"{arxiv_id}.pdf"))
        else:
            print('No PDF URL found, skipping PDF download.')

        if not result.entry_id:
            print('No entry ID found, skipping source download.')
            continue

        source_url = result.entry_id.replace("http://arxiv.org/abs/", "https://arxiv.org/src/")
        source_path = download_file(source_url, os.path.join(output_dir, f"{arxiv_id}.tar.gz"))

        authors_str = make_authors_string(result.authors)
        title_str = sanitize_filename(result.title)
        default_dir = os.path.join(output_dir, f"{arxiv_id}-{authors_str}-{title_str}")

        if no_prompt:
            paper_dir = default_dir
            print(f"Using default directory: {paper_dir}")
        else:
            try:
                paper_dir = input("Directory to extract to? ").strip()
                if paper_dir == "":
                    paper_dir = default_dir
                    print(f"Using default directory: {paper_dir}")
            except EOFError:
                paper_dir = default_dir
                print(f"Using default directory: {paper_dir}")

        tar_path = source_path[:-3]
        unzip_gz_file(source_path, tar_path)

        if tarfile.is_tarfile(tar_path):
            print('Was a tar file')
            os.makedirs(paper_dir, exist_ok=True)
            with tarfile.open(tar_path, 'r') as tar:
                tar.extractall(paper_dir)
            print(f'Extracted to {paper_dir}')
        else:
            print('Was a tex file')
            renamed_path = tar_path[:-4] + ".tex"
            print(f'Renaming {tar_path} to {renamed_path}')
            shutil.move(tar_path, renamed_path)

            print(f'making directory "{paper_dir}"')
            os.makedirs(paper_dir, exist_ok=True)

            print(f'Moving {renamed_path} to directory "{paper_dir}"')
            try:
                shutil.move(renamed_path, paper_dir)
                print(f'Extracted to {paper_dir}')
            except Exception as e:
                print(e)
                print('skipping move')

        print(f'Cleaning up temporary files: {source_path}, {tar_path}')
        try:
            os.remove(source_path)
            if os.path.exists(tar_path):
                os.remove(tar_path)
            print('Cleanup completed')
        except Exception as e:
            print(f'Error during cleanup: {e}')

        print(f'Done with {result.get_short_id()}: {result.title}')
