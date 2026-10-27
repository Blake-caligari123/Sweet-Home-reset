"""Tests for the sprite sheet pass: tools/.venv/bin/python -m unittest discover tools"""
import json, os, subprocess, sys, tempfile, unittest
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

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

    def test_multi_row_sheet_becomes_hires_strips_at_one_scale(self):
        top = bunny_sheet(); small = bunny_sheet().resize((top.width, top.height))  # same size rows
        # JPEG-style spill: blur the sheet so magenta bleeds into the outline.
        top = top.filter(ImageFilter.GaussianBlur(2)); small = small.filter(ImageFilter.GaussianBlur(2))
        img = Image.new("RGB", (top.width, top.height * 3 + 60), (255, 0, 255))
        for k in range(3): img.paste(top if k != 1 else small, (0, k * (top.height + 20)))
        src = os.path.join(tempfile.mkdtemp(), "rows.png"); img.save(src)
        tmp = tempfile.mkdtemp(); spr = os.path.join(tmp, "sprites")
        out = subprocess.run([sys.executable, SCRIPT, "test_walk", "--raw", src, "--sheet", "6", "--keep-watermark",
                              "--rows", "t_down,t_up,t_right", "--frame", "24x28", "--hires", "6",
                              "--sprites-dir", spr, "--out", os.path.join(tmp, "art")], capture_output=True, text=True)
        self.assertEqual(out.returncode, 0, out.stderr)
        manifest = json.load(open(os.path.join(spr, "manifest.json")))
        heights = []
        for name in ("t_down", "t_up", "t_right"):
            self.assertEqual(manifest["sheets"][name], {"frames": 6, "w": 144, "h": 168, "scale": 6})
            a = np.asarray(Image.open(os.path.join(spr, name + ".png")))
            self.assertEqual(a.shape[:2], (168, 864))
            for i in range(6):
                rows = np.nonzero((a[:, i * 144:(i + 1) * 144, 3] > 10).any(1))[0]
                self.assertEqual(rows.max(), 167, "feet on the bottom row"); heights.append(rows.max() - rows.min())
            vis = a[..., :3][a[..., 3] > 60].astype(int)  # no magenta tint anywhere visible
            self.assertLessEqual((np.minimum(vis[:, 0], vis[:, 2]) - vis[:, 1] > 25).mean(), 0.002)
        self.assertLessEqual(max(heights) - min(heights), 2, "one scale across all three sheets")

    def test_watermark_removal_leaves_art_in_the_corner_alone(self):
        img = Image.new("RGB", (400, 200), (255, 0, 255)); d = ImageDraw.Draw(img)
        d.rectangle((330, 120, 360, 185), fill=(120, 120, 120))  # sprite feet reaching into the corner
        d.text((365, 185), "G", fill=(255, 255, 255))  # the mark
        out, _ = pa.remove_watermark(img)
        self.assertTrue((np.asarray(out)[125:180, 335:355] == 120).all(), "feet untouched")

    def test_order_picks_and_reorders_frames(self):
        src = os.path.join(tempfile.mkdtemp(), "sheet.png"); bunny_sheet().save(src)
        tmp, out = self.run_cli(src, "--order", "1,3,5,6", "--hires", "6", "--frame", "24x28")
        self.assertEqual(out.returncode, 0, out.stderr)
        manifest = json.load(open(os.path.join(tmp, "sprites", "manifest.json")))
        self.assertEqual(manifest["sheets"]["test_bunny_walk"], {"frames": 4, "w": 144, "h": 168, "scale": 6})
        self.assertEqual(Image.open(os.path.join(tmp, "sprites", "test_bunny_walk.png")).size, (576, 168))
        _, bad = self.run_cli(src, "--order", "1,7")
        self.assertNotEqual(bad.returncode, 0)

    def test_key_colour_enclosed_by_the_art_is_cleared(self):
        img = Image.new("RGBA", (40, 40), (90, 90, 90, 255))
        ImageDraw.Draw(img).rectangle((15, 25, 20, 39), fill=(240, 0, 120, 255))  # gap between the feet
        out = np.asarray(pa.decontaminate(img, (240, 0, 120)))
        self.assertTrue((out[26:39, 16:20, 3] == 0).all())
        self.assertTrue((out[5:20, 5:30, 3] == 255).all())

    def test_rows_with_different_frame_counts_are_taken_one_at_a_time(self):
        top = bunny_sheet(n=4); bottom = bunny_sheet(n=2)
        img = Image.new("RGB", (top.width, top.height * 2 + 20), (255, 0, 255))
        img.paste(top, (0, 0)); img.paste(bottom, (0, top.height + 20))
        src = os.path.join(tempfile.mkdtemp(), "two.png"); img.save(src)
        tmp = tempfile.mkdtemp(); spr = os.path.join(tmp, "sprites")
        def run(rows, n):
            return subprocess.run([sys.executable, SCRIPT, "two", "--raw", src, "--sheet", n, "--keep-watermark", f"--rows={rows}",
                                   "--hires", "6", "--frame", "24x28", "--sprites-dir", spr, "--out", tmp], capture_output=True, text=True)
        for rows, n in (("t_idle,-", "4"), ("-,t_blink", "2")):
            out = run(rows, n); self.assertEqual(out.returncode, 0, out.stderr)
        manifest = json.load(open(os.path.join(spr, "manifest.json")))
        self.assertEqual((manifest["sheets"]["t_idle"]["frames"], manifest["sheets"]["t_blink"]["frames"]), (4, 2))

    def test_background_is_padded_to_an_exact_tile_grid(self):
        img = Image.new("RGB", (300, 150), (246, 227, 161)); ImageDraw.Draw(img).rectangle((20, 20, 280, 130), fill=(185, 147, 122))
        src = os.path.join(tempfile.mkdtemp(), "room.png"); img.save(src)
        tmp = tempfile.mkdtemp()
        out = subprocess.run([sys.executable, SCRIPT, "test_room", "--raw", src, "--background", "5x3", "--tile-px", "64",
                              "--keep-watermark", "--areas-dir", tmp], capture_output=True, text=True)
        self.assertEqual(out.returncode, 0, out.stderr)
        res = np.asarray(Image.open(os.path.join(tmp, "test_room.webp")).convert("RGBA"))
        self.assertEqual(res.shape[:2], (192, 320))
        self.assertEqual(res[185, 310, 3], 0, "padding is transparent")
        self.assertEqual(res[5, 5, 3], 0, "ground around the building is transparent")
        self.assertEqual(res[75, 150, 3], 255, "the building itself is solid")
        self.assertIn("#F6E3A1", out.stdout)

    def test_watermark_tinted_by_the_ground_beside_a_wall_is_still_removed(self):
        img = Image.new("RGB", (400, 200), (253, 231, 171)); d = ImageDraw.Draw(img)
        d.rectangle((0, 0, 365, 186), fill=(120, 80, 60))  # wall reaching into the corner
        d.rectangle((0, 187, 380, 189), fill=(215, 190, 140))  # its shadow, running into the corner
        d.text((384, 189), "G", fill=(200, 175, 120))  # the mark, tinted by the ground behind it
        out, n = pa.remove_watermark(img)
        self.assertGreater(n, 0)
        a = np.asarray(out).astype(int)
        self.assertTrue((a[150:180, 355:365] == [120, 80, 60]).all(), "wall untouched")

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
