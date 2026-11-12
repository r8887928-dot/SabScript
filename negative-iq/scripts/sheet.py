"""Contact sheet: python3 scripts/sheet.py <dir> <out.jpg> [cols] [thumbW]"""
import sys, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
tw = int(sys.argv[4]) if len(sys.argv) > 4 else 270
files = sorted(f for f in os.listdir(d) if f.endswith('.png'))
ims = [Image.open(os.path.join(d, f)).convert('RGB') for f in files]
th = int(tw * ims[0].height / ims[0].width) if ims else int(tw * 16 / 9)
rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (cols * tw, rows * (th + 24)), (20, 20, 20))
dr = ImageDraw.Draw(S)
for i, (im, fn) in enumerate(zip(ims, files)):
    x, y = (i % cols) * tw, (i // cols) * (th + 24)
    S.paste(im.resize((tw, th)), (x, y + 24))
    dr.text((x + 4, y + 4), fn, fill=(255, 255, 0))
S.save(out, quality=88)
print(out, S.size)
