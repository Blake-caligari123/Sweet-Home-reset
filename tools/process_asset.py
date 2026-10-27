#!/usr/bin/env python3
"""Sweet Home Reset asset processor (see README.md).

The bottom-right Grok mark is removed by default (Blake overruled the Ops veto, logged in
claude/LICENCES.md 27 Oct 2026); --keep-watermark keeps it. Original .jpg files are never modified
or overwritten.
"""
import argparse, json, datetime, glob, os, re, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART, CLAUDE_DIR = os.path.join(ROOT, "art"), os.path.join(ROOT, "claude")
DEFAULT_OUT = os.path.join(ROOT, "art", "_drafts")


def find_spec(asset):
    for f in sorted(glob.glob(os.path.join(CLAUDE_DIR, "asset-prompts", "*.md"))):
        txt = open(f).read()
        m = re.search(r"\*\*File:\*\*\s*`([^`]+)`", txt)
        if not m:
            continue
        path = m.group(1)
        stem = os.path.splitext(os.path.basename(path))[0]
        num = os.path.basename(f).split("-")[0]
        if asset in (stem, num, num.lstrip("0"), os.path.basename(f)[:-3]):
            size = re.search(r"\*\*Size:\*\*\s*(\d+)\s*[×x]\s*(\d+)", txt)
            tr = re.search(r"\*\*Transparent background:\*\*\s*(\w+)", txt)
            return dict(prompt_file=os.path.relpath(f, ROOT), file=path, stem=stem,
                        size=(int(size.group(1)), int(size.group(2))) if size else None,
                        transparent=bool(tr and tr.group(1).lower().startswith("y")))
    sys.exit(f"No spec found for asset '{asset}'")


def remove_watermark(img):
    """Inpaint the Grok mark in the bottom-right corner (RGB). Returns (img, pixels_changed)."""
    import cv2
    rgb = np.asarray(img.convert("RGB")).copy()
    h, w = rgb.shape[:2]
    x0, y0 = int(w * 0.88), int(h * 0.90)
    reg = rgb[y0:, x0:].astype(np.float32)
    bgc = np.median(reg.reshape(-1, 3), axis=0)
    d = np.linalg.norm(reg - bgc, axis=2)
    m = (d > 25).astype(np.uint8)
    m = cv2.dilate(m, np.ones((5, 5), np.uint8), iterations=2)
    full = np.zeros((h, w), np.uint8); full[y0:, x0:] = m * 255
    out = cv2.inpaint(rgb, full, 7, cv2.INPAINT_TELEA)
    return Image.fromarray(out), int(m.sum())


def clean_ground(rgba, tol=62, band=0.3):
    """Drop the cream ground-shadow patch under the feet: in the bottom band of the subject,
    pixels close to the background colour that touch transparency become transparent; re-feather."""
    from scipy import ndimage
    a = np.asarray(rgba).astype(np.float32).copy()
    alpha = a[..., 3]; rgb = a[..., :3]
    solid = alpha > 128
    if not solid.any():
        return rgba
    ys = np.where(solid.any(axis=1))[0]; top, bot = ys[0], ys[-1]
    y_cut = int(bot - (bot - top) * band)
    ref = np.array(BG_REF if BG_REF is not None else [250, 240, 214], np.float32)
    near = np.linalg.norm(rgb - ref, axis=2) < tol
    cand = near & solid; cand[:y_cut] = False
    lab, _ = ndimage.label(cand | ~solid)
    keep_bg = np.unique(lab[~solid]); keep_bg = keep_bg[keep_bg > 0]
    kill = np.isin(lab, keep_bg) & cand
    alpha[kill] = 0
    edge = ndimage.binary_dilation(alpha < 128, iterations=2) & (alpha >= 128)
    edge[:y_cut] = False
    soft = ndimage.gaussian_filter(alpha, 1.0)
    alpha[edge] = np.minimum(alpha[edge], soft[edge])
    a[..., 3] = alpha
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), "RGBA")


BG_REF = None


def find_raw(spec, override=None):
    if override:
        return override
    base = os.path.join(ART, os.path.splitext(spec["file"])[0])
    for ext in (".jpg", ".jpeg", ".png", ".webp"):
        if os.path.exists(base + ext):
            return base + ext
    sys.exit(f"No raw image at {base}.(jpg|png)")


def palette():
    f = os.path.join(CLAUDE_DIR, "ASSET-PROMPTS.md")
    if os.path.exists(PIXEL_PALETTE) or not os.path.exists(f):  # tools/palette24.json is the single palette source
        return [(c["name"], tuple(int(c["hex"][i:i + 2], 16) for i in (1, 3, 5)), c["hex"])
                for c in json.load(open(PIXEL_PALETTE))["colours"]]
    txt = open(f).read()
    line = next((l for l in txt.splitlines() if "Palette" in l), "")
    out = []
    for name, hx in re.findall(r"([a-zA-Z][a-zA-Z ()]*?)\s*`(#[0-9A-Fa-f]{6})`", line):
        name = name.replace("**Palette (hex):**", "").strip(" ·:")
        out.append((name, tuple(int(hx[i:i + 2], 16) for i in (1, 3, 5)), hx.upper()))
    return out


def bg_colour(rgb):
    h, w = rgb.shape[:2]; b = max(4, min(h, w) // 50)
    edge = np.concatenate([rgb[:b].reshape(-1, 3), rgb[-b:].reshape(-1, 3),
                           rgb[:, :b].reshape(-1, 3), rgb[:, -b:].reshape(-1, 3)])
    return np.median(edge, axis=0)


def cutout(img, method="auto", tol=28):
    """Return RGBA. rembg if available (method auto/rembg), else edge flood fill."""
    if method in ("auto", "rembg"):
        try:
            from rembg import remove
            return remove(img.convert("RGB")).convert("RGBA"), "rembg"
        except Exception as e:
            if method == "rembg":
                sys.exit(f"rembg failed: {e}")
    from scipy import ndimage
    rgb = np.asarray(img.convert("RGB")).astype(np.float32)
    dist = np.linalg.norm(rgb - bg_colour(rgb), axis=2)
    lab, _ = ndimage.label(dist < tol)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, border[border > 0])
    # soft edge: alpha ramps with colour distance over a 2px band
    near = ndimage.binary_dilation(bg, iterations=2) & ~bg
    alpha = np.where(bg, 0, 255).astype(np.float32)
    alpha[near] = np.clip((dist[near] - tol * 0.5) / (tol * 1.5) * 255, 0, 255)
    alpha = ndimage.gaussian_filter(alpha, 0.7)
    alpha[~ndimage.binary_dilation(bg, iterations=3)] = 255
    a = np.dstack([rgb, alpha]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(a, "RGBA"), "floodfill"


def fit(img, size, transparent):
    """Scale to fit inside size keeping aspect, then pad (transparent or edge bg)."""
    if size is None or img.size == tuple(size):
        return img
    W, H = size; s = min(W / img.width, H / img.height)
    r = img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)
    if transparent:
        fill = (0, 0, 0, 0)
    else:
        fill = tuple(int(v) for v in bg_colour(np.asarray(img.convert("RGB"))))
    canvas = Image.new(img.mode if img.mode == "RGBA" else "RGB", (W, H), fill)
    canvas.paste(r, ((W - r.width) // 2, (H - r.height) // 2), r if r.mode == "RGBA" else None)
    return canvas


def subject_mask(img):
    if img.mode == "RGBA":
        return np.asarray(img)[..., 3] > 20
    rgb = np.asarray(img.convert("RGB")).astype(np.float32)
    return np.linalg.norm(rgb - bg_colour(rgb), axis=2) > 28


def slice_frames(img, grid=None, min_area=0.002, pad=8):
    """grid='COLSxROWS' for even cells, else auto-detect separate subjects."""
    boxes = []
    if grid:
        c, r = map(int, grid.lower().split("x"))
        cw, ch = img.width / c, img.height / r
        boxes = [(round(i * cw), round(j * ch), round((i + 1) * cw), round((j + 1) * ch))
                 for j in range(r) for i in range(c)]
    else:
        from scipy import ndimage
        m = ndimage.binary_closing(subject_mask(img), iterations=6)
        m = ndimage.binary_fill_holes(m)
        lab, n = ndimage.label(m)
        for sl in ndimage.find_objects(lab):
            y, x = sl
            if (y.stop - y.start) * (x.stop - x.start) < min_area * img.width * img.height:
                continue
            boxes.append((max(0, x.start - pad), max(0, y.start - pad),
                          min(img.width, x.stop + pad), min(img.height, y.stop + pad)))
        # reading order: rows (by centre band) then left-to-right
        boxes.sort(key=lambda b: (round(((b[1] + b[3]) / 2) / (img.height / 4)), b[0]))
    return [(b, img.crop(b)) for b in boxes]


def style_report(img, spec, pal):
    a = np.asarray(img.convert("RGBA"))
    px = a[..., :3][a[..., 3] > 128] if img.mode == "RGBA" else a[..., :3].reshape(-1, 3)
    q = (px // 16).astype(np.int32)
    keys, counts = np.unique(q[:, 0] * 256 + q[:, 1] * 16 + q[:, 2], return_counts=True)
    lines = [f"  size: {img.size[0]}x{img.size[1]}  (spec {spec['size']})  "
             f"{'OK' if spec['size'] in (None, img.size) else 'MISMATCH'}",
             f"  alpha: {'yes' if img.mode == 'RGBA' else 'no'}  (spec transparent={spec['transparent']})  "
             f"{'OK' if (img.mode == 'RGBA') == spec['transparent'] else 'MISMATCH'}",
             "  dominant colours -> nearest palette (distance; <40 good, >80 off-palette):"]
    for k in keys[np.argsort(-counts)][:6]:
        sel = px[(q[:, 0] * 256 + q[:, 1] * 16 + q[:, 2]) == k]
        c = sel.mean(axis=0); share = len(sel) / len(px) * 100
        name, ref, hx = min(pal, key=lambda p: np.linalg.norm(c - p[1]))
        d = np.linalg.norm(c - ref)
        lines.append(f"    #{int(c[0]):02X}{int(c[1]):02X}{int(c[2]):02X} {share:5.1f}%  -> {name} {hx}  d={d:.0f}")
    return "\n".join(lines)


def safe_path(p):
    if p.lower().endswith((".jpg", ".jpeg")):
        sys.exit(f"Refusing to write a .jpg: {p}")
    return p


def log_licence(spec, outfile, kept):
    lic = os.path.join(CLAUDE_DIR, "LICENCES.md")
    txt = open(lic).read() if os.path.exists(lic) else ""
    header = "## Asset log"
    key = f"| {spec['stem']} | `{spec['file']}` | `{spec['prompt_file']}` |"
    if key in txt:
        return f"already logged in {lic}"
    with open(lic, "a") as f:
        if header not in txt:
            f.write(f"\n{header}\n| Asset | File | Prompt file | Date | Source |\n|---|---|---|---|---|\n")
        f.write(f"{key} {datetime.date.today().isoformat()} | Grok Imagine ({'watermark kept' if kept else 'mark removed per Blake overrule; jpg kept'}) |\n")
    return f"logged in {lic}"


PIXEL_PALETTE = os.path.join(ROOT, "tools", "palette24.json")
PIXEL_GRID = {"room": (180, 390), "puff": (48, 48), "prop": None}  # prop: per-asset, see prop_grid()
ROOM_GEN_W = 1080  # room generation width (1080x2340) -> 180 px: density 1/6
PIXEL_SCALE = 4


def load_palette24(path=PIXEL_PALETTE):
    cols = json.load(open(path))["colours"]
    return np.array([[int(c["hex"][i:i + 2], 16) for i in (1, 3, 5)] for c in cols], np.float32)


def _to_lab(rgb):
    c = rgb / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T / np.array([0.9505, 1.0, 1.089])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def despeckle(idx, keep=None):
    """Isolated pixels differing from all 4 neighbours take the majority neighbour value."""
    p = np.pad(idx, 1, mode="edge")
    n = np.stack([p[:-2, 1:-1], p[2:, 1:-1], p[1:-1, :-2], p[1:-1, 2:]])
    iso = (n != idx).all(axis=0)
    if keep is not None:
        iso &= keep
    out = idx.copy()
    for y, x in zip(*np.nonzero(iso)):
        v, c = np.unique(n[:, y, x], return_counts=True); out[y, x] = v[np.argmax(c)]
    return out, int(iso.sum())


OUTLINE_HEX = "#8A6E5E"


def _fit_pad(img, W, H, fill):
    s = min(W / img.width, H / img.height)
    r = img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.BOX)
    c = Image.new(img.mode, (W, H), fill); c.paste(r, ((W - r.width) // 2, (H - r.height) // 2)); return c


def flatten_floor(idx, lab, pal_lab, min_frac=0.05, tol=14.0):
    """Remove banding: for each big connected region of palette colours within tol (Lab) of each other,
    snap to its majority colour. Objects (colours far from the region colour) are untouched."""
    from scipy import ndimage
    out = idx.copy()
    v, c = np.unique(idx, return_counts=True)
    for k in v[np.argsort(-c)][:3]:  # the few dominant colours = floor/wall candidates
        near = np.linalg.norm(pal_lab[idx] - pal_lab[k], axis=-1) < tol
        lab_id, n = ndimage.label(near)
        for r in range(1, n + 1):
            m = lab_id == r
            if m.sum() >= min_frac * idx.size and (idx[m] == k).mean() > 0.5:
                out[m] = k
    return out


def outline(idx, pal_lab, oi, thresh=22.0):
    """1px outline on the darker side of edges between strongly different colours / alpha."""
    H, W = idx.shape; out = idx.copy()
    cl = np.where(idx[..., None] >= 0, pal_lab[np.clip(idx, 0, None)], 0)
    Lv = np.where(idx >= 0, cl[..., 0], 999)
    for dy, dx in ((0, 1), (1, 0)):
        a = idx[:H - dy, :W - dx]; b = idx[dy:, dx:]
        da = cl[:H - dy, :W - dx]; db = cl[dy:, dx:]
        diff = np.linalg.norm(da - db, axis=-1)
        alpha_edge = (a < 0) != (b < 0)
        edge = ((diff > thresh) & (a >= 0) & (b >= 0)) | alpha_edge
        la, lb = Lv[:H - dy, :W - dx], Lv[dy:, dx:]
        mark_a = edge & (la <= lb) & (a >= 0); mark_b = edge & ~mark_a & (b >= 0)
        out[:H - dy, :W - dx][mark_a] = oi; out[dy:, dx:][mark_b] = oi
    return out


def _m16(v):
    return int(min(128, max(16, round(v / 16) * 16)))


def prop_grid(spec_size, src_size):
    """Prop grid at room density, multiples of 16 (16..128/side). Uses the spec (generation) size
    from claude/ASSET-PROMPTS.md if known, else the source's aspect (long side from source size)."""
    w, h = spec_size or src_size
    k = min(180 / ROOM_GEN_W, 128 / max(w, h))  # cap the long side at 128, keep aspect
    return _m16(w * k), _m16(h * k)


def pixelize(img, kind, pal_path=PIXEL_PALETTE, contrast=1.0, do_outline=True, grid=None):
    """Fit to grid (BOX), palette24 in Lab, flatten floor, despeckle, outline, binary alpha, x4 nearest.
    Returns (x4 image, 1x image, stray-pixel count)."""
    from scipy import ndimage
    W, H = grid or PIXEL_GRID[kind]
    pal = load_palette24(pal_path); pal_lab = _to_lab(pal)
    if kind == "room":  # fit inside portrait grid; pad with dominant floor colour (bottom-centre median)
        rgb0 = np.asarray(img.convert("RGB"))
        h, w = rgb0.shape[:2]
        floor = np.median(rgb0[int(h * .55):int(h * .8), int(w * .3):int(w * .7)].reshape(-1, 3), axis=0)
        fi = int(((_to_lab(floor[None].astype(np.float32)) - pal_lab) ** 2).sum(-1).argmin())
        small = _fit_pad(img.convert("RGB"), W, H, tuple(int(v) for v in pal[fi]))
    else:
        small = _fit_pad(img.convert("RGBA"), W, H, (0, 0, 0, 0))
    a = np.asarray(small).astype(np.float32)
    rgb = np.stack([ndimage.median_filter(a[..., i], 3) for i in range(3)], -1)
    if contrast != 1.0:
        rgb = np.clip((rgb - rgb.mean((0, 1))) * contrast + rgb.mean((0, 1)), 0, 255)
    lab = _to_lab(rgb)
    w = np.array([1.0, 2.0, 2.0], np.float32)  # weight chroma x2 so muted greens/blues keep their hue
    idx = ((((lab[..., None, :] - pal_lab[None, None]) * w) ** 2).sum(-1)).argmin(-1)
    if kind == "room":
        idx = flatten_floor(idx, lab, pal_lab)
    alpha = (a[..., 3] >= 128) if a.shape[2] == 4 else np.ones((H, W), bool)
    idx = np.where(alpha, idx, -1)
    idx, n = despeckle(idx)
    if do_outline:
        oi = int(np.argmin(np.abs(pal - [int(OUTLINE_HEX[i:i + 2], 16) for i in (1, 3, 5)]).sum(1)))
        idx = outline(idx, pal_lab, oi, thresh=30.0 if kind == "room" else 22.0)
        idx, n2 = despeckle(idx); n += n2
    out = np.zeros((H, W, 4), np.uint8)
    out[..., :3] = pal[np.clip(idx, 0, None)].astype(np.uint8); out[..., 3] = (idx >= 0) * 255
    im = Image.fromarray(out, "RGBA")
    if kind == "room":
        im = im.convert("RGB")
    return im.resize((W * PIXEL_SCALE, H * PIXEL_SCALE), Image.NEAREST), im, n


# ---- sprite sheets (character animation frames for the town game) ---------------------------------

SPRITES_PUBLIC = os.path.join(ROOT, "apps", "web", "public", "sprites")
SPRITE_ART = os.path.join(ART, "sprites")
# Pixels that carry deliberate 1 px detail (eyes, catchlights, outline) survive despeckling.
DETAIL_HEX = ("#8A6E5E", "#534239", "#FFFFFF")


def _hex_rgb(hx):
    return [int(hx[i:i + 2], 16) for i in (1, 3, 5)]


def _pal_index(pal, hx):
    return int(np.argmin(np.abs(pal - _hex_rgb(hx)).sum(1)))


def sheet_subjects(img, count=None, grid=None):
    """Cut-out frames from one RGBA sheet: even grid cells (grid='COLSxROWS') or separate
    subjects in reading order. Each frame is cropped to its opaque pixels."""
    cells = [fr for _, fr in slice_frames(img, grid)]
    frames = []
    for fr in cells:
        ys, xs = np.nonzero(np.asarray(fr)[..., 3] >= 128)
        if len(ys):
            frames.append(fr.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)))
    if count and len(frames) != count:
        sys.exit(f"Found {len(frames)} frames in the sheet, expected {count}. "
                 f"Pass --grid COLSxROWS if the frames touch or the background is uneven.")
    return frames


def _shrink(fr, k):
    """Area-average downscale with premultiplied alpha, so edges don't pick up the background."""
    a = np.asarray(fr.convert("RGBA")).astype(np.float32) / 255.0
    W, H = max(1, round(fr.width * k)), max(1, round(fr.height * k))
    al = a[..., 3]
    chans = [a[..., i] * al for i in range(3)] + [al]
    out = [np.asarray(Image.fromarray(c, "F").resize((W, H), Image.BOX)) for c in chans]
    rgb = np.stack(out[:3], -1) / np.maximum(out[3], 1e-6)[..., None]
    return np.clip(rgb * 255, 0, 255), out[3]


def _ring(idx):
    """Transparent pixels that touch an opaque one (4-neighbour): where the outline goes."""
    o = idx >= 0
    p = np.pad(o, 1)
    return (p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]) & ~o


def pixel_sheet(frames, fw, fh, baseline=None, do_outline=True, pal_path=PIXEL_PALETTE):
    """Frames (RGBA crops) -> one-row strip of fw x fh cells in palette24 only, binary alpha.
    One shared scale for every frame (no size popping), each body centred, the lowest pixel
    (outline under the feet) on the same baseline row. Returns (strip 1x RGBA, report lines)."""
    pal = load_palette24(pal_path); pal_lab = _to_lab(pal)
    oi = _pal_index(pal, OUTLINE_HEX)
    detail = [_pal_index(pal, hx) for hx in DETAIL_HEX]
    lines = [_pal_index(pal, hx) for hx in ("#8A6E5E", "#534239", "#9F8272", "#946F57")]
    baseline = fh - 1 if baseline is None else baseline
    pad = 1 if do_outline else 0
    k = min((fw - 2 * pad) / max(f.width for f in frames), (baseline + 1 - 2 * pad) / max(f.height for f in frames))
    w8 = np.array([1.0, 2.0, 2.0], np.float32)  # chroma x2 so muted greens/blues keep their hue
    strip = np.full((fh, fw * len(frames)), -1, int)
    report = [f"  scale {k:.4f} (shared by all {len(frames)} frames), cell {fw}x{fh}, feet on row {baseline}"]
    for i, fr in enumerate(frames):
        rgb, al = _shrink(fr, k)
        idx = ((((_to_lab(rgb)[..., None, :] - pal_lab[None, None]) * w8) ** 2).sum(-1)).argmin(-1)
        idx = np.where(al >= 0.5, idx, -1)
        idx, _ = despeckle(idx, keep=~np.isin(idx, detail))
        if do_outline:
            # The source's own (usually thick) outline: peel its outer layer so only our crisp 1 px ring remains.
            edge = (idx >= 0) & _ring(np.where(idx >= 0, -1, 0))
            idx[edge & np.isin(idx, lines)] = -1
        ys, xs = np.nonzero(idx >= 0)
        if not len(ys):
            sys.exit(f"Frame {i + 1} vanished when shrunk to {fw}x{fh}")
        idx = idx[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        h, w = idx.shape
        cx = np.nonzero(idx >= 0)[1].mean()
        ox = int(min(max(round((fw - 1) / 2 - cx), pad), fw - pad - w))
        oy = baseline - pad - h + 1
        cell = np.full((fh, fw), -1, int)
        cell[oy:oy + h, ox:ox + w] = idx
        if do_outline:
            cell[_ring(cell)] = oi
        strip[:, i * fw:(i + 1) * fw] = cell
        report.append(f"  frame {i + 1}: body {w}x{h}, centre x {ox + cx:.1f}")
    out = np.zeros((fh, strip.shape[1], 4), np.uint8)
    out[..., :3] = pal[np.clip(strip, 0, None)].astype(np.uint8); out[..., 3] = (strip >= 0) * 255
    return Image.fromarray(out, "RGBA"), report


def update_sprite_manifest(sprites_dir, name, frames, fw, fh):
    path = os.path.join(sprites_dir, "manifest.json")
    data = json.load(open(path)) if os.path.exists(path) else {"version": 1, "sheets": {}}
    data["sheets"][name] = {"frames": frames, "w": fw, "h": fh}
    data["sheets"] = dict(sorted(data["sheets"].items()))
    with open(path, "w") as f:
        json.dump(data, f, indent=1); f.write("\n")
    return path


def find_sheet_raws(name, raw):
    if raw:
        return raw.split(",")
    for ext in (".png", ".jpg", ".jpeg", ".webp"):
        p = os.path.join(SPRITE_ART, "raw", name + ext)
        if os.path.exists(p):
            return [p]
    sys.exit(f"No raw sheet at art/sprites/raw/{name}.(png|jpg|webp); pass --raw")


def run_sheet(a):
    """--sheet N: process a character sprite sheet (see claude/SPRITE-SHEETS.md)."""
    global BG_REF
    name = a.asset
    if not re.fullmatch(r"[a-z0-9]+(_[a-z0-9]+)*", name):
        sys.exit(f"Sheet names are lowercase snake_case, got '{name}'")
    fw, fh = map(int, a.frame.lower().split("x"))
    raws = find_sheet_raws(name, a.raw)
    frames = []
    for r in raws:
        img = Image.open(r).convert("RGB")
        BG_REF = bg_colour(np.asarray(img))
        if not a.keep_watermark:
            img, n = remove_watermark(img); print(f"{os.path.basename(r)}: watermark removed (inpainted {n} px, per Blake overrule)")
        img, how = cutout(img, a.cutout if a.cutout != "off" else "floodfill"); print(f"{os.path.basename(r)}: cutout {how}")
        got = sheet_subjects(img, None if len(raws) > 1 else a.sheet, a.grid)
        if len(raws) > 1 and len(got) != 1:
            sys.exit(f"{r}: expected one frame per file, found {len(got)}")
        frames += got
    if len(frames) != a.sheet:
        sys.exit(f"Got {len(frames)} frames, expected {a.sheet}")
    if not a.no_ground_clean:
        frames = [clean_ground(f) for f in frames]
    strip, report = pixel_sheet(frames, fw, fh, do_outline=not a.no_outline)
    os.makedirs(a.sprites_dir, exist_ok=True); os.makedirs(a.out, exist_ok=True)
    dst = safe_path(os.path.join(a.sprites_dir, name + ".png")); strip.save(dst)
    preview = safe_path(os.path.join(a.out, name + "_x4.png"))
    strip.resize((strip.width * PIXEL_SCALE, strip.height * PIXEL_SCALE), Image.NEAREST).save(preview)
    print(f"wrote {dst} ({strip.width}x{strip.height}, {a.sheet} frames) and preview {preview}")
    print("\n".join(report))
    print(f"manifest: {update_sprite_manifest(a.sprites_dir, name, a.sheet, fw, fh)}")
    if a.log:
        spec = dict(stem=name, file=os.path.relpath(dst, ROOT), prompt_file="claude/SPRITE-SHEETS.md")
        print(log_licence(spec, dst, a.keep_watermark))


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("asset", help="asset id: stem (puff_model_sheet), number (1/01) or prompt file stem")
    p.add_argument("--raw", help="override raw input path (sheet mode: a comma list = one frame per file)")
    p.add_argument("--out", default=DEFAULT_OUT, help=f"output dir (default {DEFAULT_OUT}); may be art/<group>/ for finals (.jpg never written)")
    p.add_argument("--cutout", choices=["auto", "rembg", "floodfill", "off"], default="auto",
                   help="cutout method if spec says transparent (default auto)")
    p.add_argument("--force-cutout", action="store_true", help="cut out even if spec says not transparent")
    p.add_argument("--slice", nargs="?", const="auto", help="slice frames: 'auto' or grid like 4x2")
    p.add_argument("--slice-cutout", action="store_true", help="cut each sliced frame out to RGBA")
    p.add_argument("--names", help="comma list of frame names, in reading order")
    p.add_argument("--log", action="store_true", help="append a line to claude/LICENCES.md")
    p.add_argument("--keep-watermark", action="store_true", help="do not remove the bottom-right Grok mark")
    p.add_argument("--no-ground-clean", action="store_true", help="keep the cream ground patch under feet")
    p.add_argument("--canvas", help="pad each sliced frame to WxH (e.g. to match an existing file)")
    p.add_argument("--only", help="comma list of frame names to write (others skipped)")
    p.add_argument("--pixel", choices=["room", "puff", "prop"],
                   help="pixel-art pass: room 180x390 portrait (fit+floor pad), puff 48x48, prop per-asset multiples of 16 at room density; palette tools/palette24.json; x4 nearest; writes <stem>_pixel.png")
    p.add_argument("--pixel-contrast", type=float, default=1.0, help="contrast boost before palette mapping (default 1.0)")
    p.add_argument("--no-outline", action="store_true", help="skip the 1px #8A6E5E outline pass")
    p.add_argument("--sheet", type=int, metavar="N",
                   help="sprite sheet mode: N frames -> one-row strip at --frame size in apps/web/public/sprites/ (see claude/SPRITE-SHEETS.md)")
    p.add_argument("--frame", default="24x24", help="sheet cell size WxH (default 24x24, the world Puff)")
    p.add_argument("--grid", help="sheet: split the source into even COLSxROWS cells instead of finding subjects")
    p.add_argument("--sprites-dir", default=SPRITES_PUBLIC, help="sheet: engine output dir (default apps/web/public/sprites)")
    a = p.parse_args()
    if a.sheet:
        if a.out == DEFAULT_OUT:
            a.out = SPRITE_ART
        return run_sheet(a)

    out = os.path.abspath(a.out)
    try:
        spec = find_spec(a.asset)
    except SystemExit:
        if not (a.raw and a.pixel):
            raise
        stem = os.path.splitext(os.path.basename(a.raw))[0]
        spec = dict(prompt_file="(none)", file=os.path.relpath(a.raw, ART), stem=stem, size=None,
                    transparent=a.pixel != "room")
    raw = find_raw(spec, a.raw)
    os.makedirs(out, exist_ok=True)
    pal = palette()
    print(f"asset {spec['stem']}  raw {raw}\nspec {spec['prompt_file']} size={spec['size']} transparent={spec['transparent']}")
    img = Image.open(raw).convert("RGB")
    global BG_REF
    BG_REF = bg_colour(np.asarray(img))
    if a.keep_watermark:
        print("watermark: kept (--keep-watermark)")
    else:
        img, n = remove_watermark(img); print(f"watermark: removed (inpainted {n} px, per Blake overrule)")
    if (spec["transparent"] or a.force_cutout) and a.cutout != "off":
        img, how = cutout(img, a.cutout); print(f"cutout: {how}")
        if not a.no_ground_clean: img = clean_ground(img)
    img = fit(img, spec["size"], img.mode == "RGBA")
    dst = safe_path(os.path.join(out, spec["stem"] + ".png")); img.save(dst); print(f"wrote {dst}")
    if a.pixel:
        grid = prop_grid(spec["size"], img.size) if a.pixel == "prop" else PIXEL_GRID[a.pixel]
        px, px1, n = pixelize(img, a.pixel, contrast=a.pixel_contrast, do_outline=not a.no_outline, grid=grid)
        pdst = safe_path(os.path.join(out, spec["stem"] + "_pixel.png")); px.save(pdst)
        px1.save(safe_path(os.path.join(out, spec["stem"] + "_pixel_1x.png")))
        print(f"pixel: {a.pixel} grid {grid} x{PIXEL_SCALE}, {n} stray px fixed -> {pdst} {px.size}")
    print(style_report(img, spec, pal))
    if a.slice:
        frames = slice_frames(img, None if a.slice == "auto" else a.slice)
        names = a.names.split(",") if a.names else []
        for i, (box, fr) in enumerate(frames):
            if a.slice_cutout and fr.mode != "RGBA":
                fr, _ = cutout(fr, a.cutout if a.cutout != "off" else "floodfill")
                if not a.no_ground_clean: fr = clean_ground(fr)
            n = names[i] if i < len(names) else f"{spec['stem']}_frame{i + 1:02d}"
            if a.only and n not in a.only.split(","):
                continue
            if a.canvas:
                cw, ch = map(int, a.canvas.lower().split("x")); fr = fit(fr, (cw, ch), fr.mode == "RGBA")
            fp = safe_path(os.path.join(out, n + ".png")); fr.save(fp)
            print(f"  frame {i + 1}: box={box} size={fr.size} -> {fp}")
    if a.log:
        print(log_licence(spec, dst, a.keep_watermark))


if __name__ == "__main__":
    main()
