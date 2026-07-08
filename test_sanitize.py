import unittest

from arxiv_downloader.utils import sanitize_filename


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
