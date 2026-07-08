#!/usr/bin/env python
import importlib.machinery
import importlib.util
import unittest
import os

script_path = os.path.join(os.path.dirname(__file__), 'arxiv-download')
loader = importlib.machinery.SourceFileLoader('arxiv_download', script_path)
spec = importlib.util.spec_from_loader('arxiv_download', loader, origin=script_path)
mod = importlib.util.module_from_spec(spec)
loader.exec_module(mod)
sanitize_filename = mod.sanitize_filename


class TestSanitizeFilename(unittest.TestCase):
    def test_spaces_replaced_with_dashes(self):
        self.assertEqual(sanitize_filename("hello world"), "hello-world")

    def test_dollars_removed(self):
        self.assertEqual(sanitize_filename("$q$-series"), "q-series")

    def test_colons_removed(self):
        self.assertEqual(sanitize_filename("series: part two"), "series-part-two")

    def test_windows_invalid_chars_removed(self):
        self.assertEqual(
            sanitize_filename('a<b>c"d/e\\f|g?h*i'),
            "abcdefghi",
        )

    def test_trailing_dash_stripped(self):
        self.assertEqual(sanitize_filename("hello -"), "hello")

    def test_leading_dash_stripped(self):
        self.assertEqual(sanitize_filename("- hello"), "hello")

    def test_truncated_at_50_chars(self):
        long = "a" * 60
        self.assertEqual(len(sanitize_filename(long)), 50)

    def test_real_arxiv_title(self):
        result = sanitize_filename("Formalized $q$-series: The Rogers-Ramanujan Identities")
        self.assertNotIn("$", result)
        self.assertNotIn(":", result)
        self.assertNotIn(" ", result)

    def test_empty_after_sanitize_returns_empty(self):
        self.assertEqual(sanitize_filename("$$$:::"), "")


if __name__ == '__main__':
    unittest.main()
