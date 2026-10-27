"""Tests for the sprite sheet pass: tools/.venv/bin/python -m unittest discover tools"""
import json, os, subprocess, sys, tempfile, unittest
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(__file__))
import process_asset as pa  # noqa: E402

PAL = {tuple(c) for c in pa.load_palette24().astype(int).tolist()}
OUTLINE = tuple(pa._hex_rgb(pa.OUTLINE_HEX))
SCRIPT = os.path.join(os.path.dirname(__file__), "process_asset.py")


def bunny_sheet(n=6, cell=160, bob=(0, -10, 0, 0, -10, 0), bg=(255, 0, 255)):
    """A big AI-style sheet: n soft-shaded bunnies on a flat background, bobbing up and down."""
    img = Image.new("RGB", (cell * n, cell + 40), bg)
    d = ImageDraw.Draw(img)
    for i in range(n):
        x0 = i * cell + 20 + (i % 2) * 6; y0 = 30 + bob[i % len(bob)]
        for ex in (x0 + 35, x0 + 75):
            d.ellipse((ex, y0, ex + 22, y0 + 60), fill=(220, 214, 209), outline=(138, 110, 94), width=4)
        d.ellipse((x0, y0 + 40, x0 + 130, y0 + 130), fill=(218, 213, 209), outline=(138, 110, 94), width=5)
        d.ellipse((x0 + 20, y0 + 50, x0 + 70, y0 + 80), fill=(255, 255, 255))
        for ex in (x0 + 40, x0 + 82):
            d.rectangle((ex, y0 + 75, ex + 9, y0 + 87), fill=(83, 66, 57))
    return img


class SheetTest(unittest.TestCase):
    def run_cli(self, raw, *extra):
        tmp = tempfile.mkdtemp()
        out = subprocess.run([sys.executable, SCRIPT, "test_bunny_walk", "--raw", raw, "--sheet", "6", "--keep-watermark",
                              "--sprites-dir", os.path.join(tmp, "sprites"), "--out", os.path.join(tmp, "art"), *extra],
                             capture_output=True, text=True)
        return tmp, out

    def test_big_sheet_becomes_a_clean_24px_strip(self):
        src = os.path.join(tempfile.mkdtemp(), "sheet.png"); bunny_sheet().save(src)
        tmp, out = self.run_cli(src)
        self.assertEqual(out.returncode, 0, out.stderr)
        strip = np.asarray(Image.open(os.path.join(tmp, "sprites", "test_bunny_walk.png")).convert("RGBA"))
        self.assertEqual(strip.shape[:2], (24, 144))
        self.assertTrue(set(np.unique(strip[..., 3]).tolist()) <= {0, 255}, "alpha is hard 0/255")
        opaque = strip[..., 3] == 255
        self.assertTrue({tuple(c) for c in strip[..., :3][opaque].tolist()} <= PAL, "only palette24 colours")
        heights = []
        for i in range(6):
            cell = opaque[:, i * 24:(i + 1) * 24]
            rows = np.nonzero(cell.any(1))[0]
            self.assertEqual(rows.max(), 23, f"frame {i + 1}: feet on the baseline row")
            heights.append(rows.max() - rows.min())
            # Every edge pixel of the silhouette is the outline colour.
            c = strip[:, i * 24:(i + 1) * 24]
            pad = np.pad(cell, 1)
            edge = cell & ~(pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])
            self.assertTrue(all(tuple(p) == OUTLINE for p in c[..., :3][edge].tolist()), f"frame {i + 1}: outlined")
            xs = np.nonzero(cell)[1]
            self.assertLess(abs(xs.mean() - 11.5), 1.5, f"frame {i + 1}: centred")
        self.assertLessEqual(max(heights) - min(heights), 1, "one shared scale: no size popping between frames")
        manifest = json.load(open(os.path.join(tmp, "sprites", "manifest.json")))
        self.assertEqual(manifest["sheets"]["test_bunny_walk"], {"frames": 6, "w": 24, "h": 24})
        self.assertTrue(os.path.exists(os.path.join(tmp, "art", "test_bunny_walk_x4.png")))

    def test_keeps_the_eyes(self):
        strip, _ = pa.pixel_sheet(pa.sheet_subjects(pa.cutout(bunny_sheet(), "floodfill")[0], 6), 24, 24)
        a = np.asarray(strip)
        ink = (a[..., 3] == 255) & (np.abs(a[..., :3].astype(int) - pa._hex_rgb("#534239")).sum(-1) == 0)
        for i in range(6):
            self.assertGreaterEqual(ink[:, i * 24:(i + 1) * 24].sum(), 2, f"frame {i + 1} still has eyes")

    def test_close_set_frames_in_one_row_are_still_found(self):
        sheet = bunny_sheet(cell=140)  # 140 px cells hold ~136 px bunnies: gaps of a few px
        frames = pa.sheet_subjects(pa.cutout(sheet, "floodfill")[0], 6)
        self.assertEqual(len(frames), 6)

    def test_wrong_frame_count_is_a_clear_error(self):
        src = os.path.join(tempfile.mkdtemp(), "sheet.png"); bunny_sheet(n=5).save(src)
        _, out = self.run_cli(src)
        self.assertNotEqual(out.returncode, 0)
        self.assertIn("expected 6", out.stderr)

    def test_one_frame_per_file(self):
        d = tempfile.mkdtemp(); paths = []
        for i in range(6):
            p = os.path.join(d, f"f{i}.png"); bunny_sheet(n=1, bob=((0, -10, 0, 0, -10, 0)[i],)).save(p); paths.append(p)
        tmp, out = self.run_cli(",".join(paths))
        self.assertEqual(out.returncode, 0, out.stderr)
        self.assertEqual(Image.open(os.path.join(tmp, "sprites", "test_bunny_walk.png")).size, (144, 24))


if __name__ == "__main__":
    unittest.main()
