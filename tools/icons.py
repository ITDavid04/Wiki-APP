"""Erzeugt die App-Icons in src/icons/ (einmalig, Ergebnis liegt im Repo).

Motiv: das Markenzeichen aus dem Kopf der Seite, vier abgerundete Quadrate,
oben links und unten rechts gefüllt, die anderen beiden umrandet, auf dem
dunklen Grün der Bühne. Aufruf: python3 tools/icons.py
"""
import pathlib

from PIL import Image, ImageDraw

OUT = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'icons'
BG = (15, 26, 21)          # --stage #0F1A15
FILL = (63, 161, 106)      # #3FA16A
LINE = (95, 211, 162)      # #5FD3A2


def draw(size, mark_share, radius_share=0.0):
    """mark_share: Anteil der Kantenlänge, den das Zeichen einnimmt."""
    k = 4                                   # vierfach zeichnen, dann verkleinern
    S = size * k
    img = Image.new('RGB', (S, S), BG)
    if radius_share:
        mask = Image.new('L', (S, S), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * radius_share), fill=255)
        img.putalpha(mask)
    d = ImageDraw.Draw(img)
    m = S * mark_share
    gap = m * 0.12
    cell = (m - gap) / 2
    x0 = (S - m) / 2
    y0 = (S - m) / 2
    r = cell * 0.26
    w = max(2, int(cell * 0.16))
    for row in range(2):
        for col in range(2):
            x = x0 + col * (cell + gap)
            y = y0 + row * (cell + gap)
            box = [x, y, x + cell, y + cell]
            if row == col:
                d.rounded_rectangle(box, radius=r, fill=FILL)
            else:
                d.rounded_rectangle(box, radius=r, outline=LINE, width=w)
    return img.resize((size, size), Image.LANCZOS)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    draw(192, 0.56).save(OUT / 'icon-192.png')
    draw(512, 0.56).save(OUT / 'icon-512.png')
    draw(512, 0.44).save(OUT / 'icon-maskable-512.png')    # Zeichen bleibt im sicheren Kreis (80 %)
    draw(180, 0.52).save(OUT / 'apple-touch-icon.png')
    (OUT / 'favicon.svg').write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
        '<rect width="64" height="64" rx="14" fill="#0F1A15"/>'
        '<rect x="14" y="14" width="16" height="16" rx="4" fill="#3FA16A"/>'
        '<rect x="35.5" y="15.5" width="13" height="13" rx="3.5" fill="none" stroke="#5FD3A2" stroke-width="3"/>'
        '<rect x="15.5" y="35.5" width="13" height="13" rx="3.5" fill="none" stroke="#5FD3A2" stroke-width="3"/>'
        '<rect x="34" y="34" width="16" height="16" rx="4" fill="#3FA16A"/>'
        '</svg>\n', encoding='utf-8')
    print('Icons in', OUT)


if __name__ == '__main__':
    main()
