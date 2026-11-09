"""
Builds the Sayyab statue cut-out (RGBA, 3x upscaled and detail-enhanced), a normal map and an
inflation depth-map from the open-licence photo (public/assets/sayyab.jpg, David Stanley, CC BY 2.0).
Run:  python tools/make_statue_cutout.py
"""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

SRC = 'public/assets/sayyab.jpg'
SCALE = 3
im = Image.open(SRC).convert('RGB')
a = np.asarray(im).astype(np.float32)
X0, X1, Y0, Y1 = 376, 640, 62, 516
crop = a[Y0:Y1, X0:X1]
lum = crop @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
r, g, b = crop[..., 0], crop[..., 1], crop[..., 2]

mask = (lum < 112) & ~((b > r + 28) & (lum > 80))
yy, xx = np.mgrid[0:crop.shape[0], 0:crop.shape[1]]
foot = yy > (452 - Y0)
mask &= ~(foot & ((xx + X0 < 452) | (xx + X0 > 532)))
mask = ndi.binary_opening(mask, iterations=1)
mask = ndi.binary_closing(mask, iterations=3)
lab, n = ndi.label(mask)
if n:
    sizes = ndi.sum(mask, lab, range(1, n + 1))
    mask = lab == (1 + int(np.argmax(sizes)))
mask = ndi.binary_fill_holes(mask)

ys, xs = np.where(mask)
pad = 6
y0, x0 = max(0, ys.min() - pad), max(0, xs.min() - pad)
y1, x1 = min(mask.shape[0], ys.max() + 1 + pad), min(mask.shape[1], xs.max() + 1 + pad)
mask = mask[y0:y1, x0:x1]
rgb = crop[y0:y1, x0:x1]
h, w = mask.shape
OX, OY = X0 + x0, Y0 + y0   # photo coords of the cut-out's top-left pixel

# ---- body-only mask: the head and both hands are sculpted separately in 3D ----
cut = np.zeros_like(mask)
gy, gx = np.mgrid[0:h, 0:w]
px_, py_ = gx + OX, gy + OY
cut |= py_ < 141                              # head (neck is rebuilt in 3D)
cut |= (px_ < 426) & (py_ > 248) & (py_ < 306)  # viewer-left hand
cut |= (px_ > 584) & (py_ > 318)              # viewer-right hand
body_mask = mask & ~cut
import json
json.dump({'ox': int(OX), 'oy': int(OY), 'w': int(w), 'h': int(h)}, open('public/assets/sayyab-meta.json', 'w'))
Image.fromarray((body_mask * 255).astype(np.uint8), 'L').save('public/assets/sayyab-bodymask.png')

# ---- depth (original resolution) ----
d = ndi.distance_transform_edt(body_mask)
depth = ndi.gaussian_filter(np.sqrt(d), 2.2) * body_mask
depth = depth / depth.max()
Image.fromarray((depth * 255).astype(np.uint8), 'L').save('public/assets/sayyab-depth.png')

# ---- colour: 3x Lanczos, shadow lift, local contrast (reveals folds, face, tie) ----
big = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).resize((w * SCALE, h * SCALE), Image.LANCZOS)
big = np.asarray(big).astype(np.float32)
lumb = big @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
# bronze warm tint instead of the sky-blue cast
warm = np.stack([lumb * 1.14 + 8, lumb * 0.98 + 3, lumb * 0.78], axis=-1)
out = big * 0.35 + warm * 0.65
# local contrast: add back the detail layer
blur = ndi.gaussian_filter(out, sigma=(7, 7, 0))
out = out + (out - blur) * 1.9
# lift deep shadows, gentle curve
out = np.clip(out, 0, 255) / 255.0
out = np.power(out, 0.78)
out = np.clip(out * 1.18, 0, 1) * 255.0
# unsharp for crisp edges
pil = Image.fromarray(out.astype(np.uint8)).filter(ImageFilter.UnsharpMask(radius=2.2, percent=140, threshold=2))
out = np.asarray(pil).astype(np.float32)

# ---- alpha: bicubic upscale of the mask, sharpened edge, then fill the rim from the interior ----
m_big = np.asarray(Image.fromarray((body_mask * 255).astype(np.uint8)).resize((w * SCALE, h * SCALE), Image.BICUBIC)).astype(np.float32) / 255
m_big = ndi.gaussian_filter(m_big, 1.4)
solid = m_big > 0.5
good = ndi.binary_erosion(solid, iterations=5)
idx = ndi.distance_transform_edt(~good, return_distances=False, return_indices=True)
out = out[idx[0], idx[1]]
alpha = np.clip((ndi.gaussian_filter(ndi.binary_erosion(solid, iterations=2).astype(np.float32), 1.2) - 0.35) / 0.3, 0, 1)
rgba = np.dstack([out, alpha * 255]).astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save('public/assets/sayyab-statue.png')

# ---- normal map from luminance (fine surface relief for real lighting) ----
hl = ndi.gaussian_filter(out @ np.array([0.299, 0.587, 0.114], dtype=np.float32), 1.3) / 255.0
gx = ndi.sobel(hl, axis=1) * 3.2
gy = ndi.sobel(hl, axis=0) * 3.2
nz = np.ones_like(gx)
ln = np.sqrt(gx * gx + gy * gy + nz * nz)
nrm = np.dstack([(-gx / ln) * 0.5 + 0.5, (gy / ln) * 0.5 + 0.5, (nz / ln) * 0.5 + 0.5])
Image.fromarray((nrm * 255).astype(np.uint8), 'RGB').save('public/assets/sayyab-normal.png')
print('saved', rgba.shape)
