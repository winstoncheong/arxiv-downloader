# arxiv-downloader

Download papers from arXiv (PDF + LaTeX source).

## Install

```sh
pip install .
```

## Usage

```
arxiv-download [options] [IDs...]
```

Download one or more papers by arXiv ID:

```sh
arxiv-download 2607.01544
arxiv-download 2607.01544 2607.01545
```

With no arguments, enters interactive REPL mode.

### Options

| Flag | Description |
|------|-------------|
| `--output-dir DIR` | Output directory (default: current directory) |
| `--no-prompt` | Use default directory names without prompting |
| `-i, --interactive` | Force interactive REPL mode |
| `--version` | Show version |
| `-h, --help` | Show help |
