# 用法：make_cover.py cover-bg.png zcool.ttf 输出目录
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
bg, font, out = sys.argv[1:4]
im = Image.open(bg).convert('RGB'); W, H = im.size
def text_center(img, y, s, size, fill, stroke, sw):
    f = ImageFont.truetype(font, size)
    d = ImageDraw.Draw(img)
    w = d.textlength(s, font=f)
    # 软阴影
    sh = Image.new('RGBA', img.size, (0,0,0,0)); ds = ImageDraw.Draw(sh)
    ds.text(((W-w)/2+6, y+10), s, font=f, fill=(20,60,20,110), stroke_width=sw, stroke_fill=(20,60,20,110))
    sh = sh.filter(ImageFilter.GaussianBlur(8))
    img.paste(sh, (0,0), sh)
    d.text(((W-w)/2, y), s, font=f, fill=fill, stroke_width=sw, stroke_fill=stroke)
im = im.convert('RGBA')
text_center(im, 250, '苹果果园数学', 170, (255,255,255), (46,125,50), 14)
# 副标题胶囊
f2 = ImageFont.truetype(font, 64); s2 = '二年级 · 数位和数值'
d = ImageDraw.Draw(im); w2 = d.textlength(s2, font=f2)
x0 = (W-w2)/2-44; y0 = 470
d.rounded_rectangle((x0, y0, x0+w2+88, y0+104), radius=52, fill=(255,255,255,235), outline=(229,57,53), width=6)
d.text(((W-w2)/2, y0+16), s2, font=f2, fill=(198,40,40))
im = im.convert('RGB')
im.save(f'{out}/cover.jpg', quality=86, optimize=True)
# og：中间 4:3 → 1200×900
cw = round(H*4/3); og = im.crop(((W-cw)//2, 0, (W-cw)//2+cw, H)).resize((1200, 900), Image.LANCZOS)
og.save(f'{out}/og.jpg', quality=82, optimize=True)
