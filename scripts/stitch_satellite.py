import urllib.request
import ssl
from io import BytesIO
from PIL import Image
import os

zoom = 12
startX = 2927
startY = 1897
tilesX = 6
tilesY = 4

context = ssl._create_unverified_context()
canvas = Image.new('RGB', (tilesX * 256, tilesY * 256))

for y in range(tilesY):
    for x in range(tilesX):
        tx = startX + x
        ty = startY + y
        url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{zoom}/{ty}/{tx}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=context) as resp:
            tile_data = resp.read()
            tile_img = Image.open(BytesIO(tile_data))
            canvas.paste(tile_img, (x * 256, y * 256))

paths = [
    'assets/bangalore-satellite-aerial.jpg',
    'dist/assets/bangalore-satellite-aerial.jpg',
    'public/images/bangalore-satellite-aerial.jpg',
    'images/bangalore-satellite-aerial.jpg'
]

for p in paths:
    os.makedirs(os.path.dirname(p), exist_ok=True)
    canvas.save(p, 'JPEG', quality=92)

print(f"Stitched binary JPEG satellite map saved to {len(paths)} locations: {canvas.size}")
