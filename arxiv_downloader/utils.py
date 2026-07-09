import re


def sanitize_filename(title: str) -> str:
    return re.sub(r'[<>:"/\\|?*$]', '', title[:50]).replace(' ', '-').strip('- ')


def make_authors_string(authors):
    last_names = [str(author).split()[-1] for author in authors]
    truncated = last_names[:5]
    return ','.join(truncated)
