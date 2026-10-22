"""Genera las imagenes para grabar Reels/TikTok de Rumbo en OBS (lienzo 1080x1920).

- marco-iphone.png: cuerpo del telefono con sombra; la pantalla queda transparente
  para que se vea la captura de Rumbo debajo.
- zonas-seguras.png: guia (oculta en OBS) de lo que tapan los botones de Instagram y TikTok.

Uso: python generar_imagenes.py   (no necesita librerias extra)
"""
import math
import struct
import zlib
from pathlib import Path

W, H = 1080, 1920

# Pantalla del telefono (donde va la captura) y cuerpo alrededor.
SCREEN = (40, 288, 620, 1344)  # x, y, ancho, alto
SCREEN_R = 78
BEZEL = 20
BODY = (SCREEN[0] - BEZEL, SCREEN[1] - BEZEL, SCREEN[2] + 2 * BEZEL, SCREEN[3] + 2 * BEZEL)
BODY_R = SCREEN_R + BEZEL
ISLAND = (SCREEN[0] + SCREEN[2] / 2 - 88, SCREEN[1] + 22, 176, 52)


def write_png(path, width, height, pixel_rows):
    raw = b"".join(b"\x00" + row for row in pixel_rows)

    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    Path(path).write_bytes(png)


def rrect_dist(px, py, rect, r):
    """Distancia con signo a un rectangulo redondeado (negativa adentro)."""
    x, y, w, h = rect
    cx, cy = x + w / 2, y + h / 2
    qx = abs(px - cx) - (w / 2 - r)
    qy = abs(py - cy) - (h / 2 - r)
    outside = math.hypot(max(qx, 0), max(qy, 0))
    return outside + min(max(qx, qy), 0) - r


def cover(d):
    return min(1.0, max(0.0, 0.5 - d))


def over(dst, src):
    """Compone src (r,g,b,a en 0..1) sobre dst."""
    sr, sg, sb, sa = src
    dr, dg, db, da = dst
    oa = sa + da * (1 - sa)
    if oa <= 0:
        return (0, 0, 0, 0)
    mix = lambda s, d: (s * sa + d * da * (1 - sa)) / oa
    return (mix(sr, dr), mix(sg, dg), mix(sb, db), oa)


def phone_frame():
    x0, y0, bw, bh = BODY
    rows = []
    for py in range(H):
        row = bytearray(W * 4)
        if y0 - 90 <= py <= y0 + bh + 110:
            for px in range(0, min(W, x0 + bw + 90)):
                p = (px + 0.5, py + 0.5)
                col = (0.0, 0.0, 0.0, 0.0)
                # Sombra suave, un poco hacia abajo; solo fuera del cuerpo (nunca sobre la pantalla).
                d_body = rrect_dist(p[0], p[1], BODY, BODY_R)
                ds = rrect_dist(p[0], p[1] - 24, BODY, BODY_R)
                a = 0.55 * math.exp(-((max(ds, 0) / 46) ** 2)) * (1 - cover(d_body))
                if a > 0.002:
                    col = over(col, (0, 0, 0, a))
                d_screen = rrect_dist(p[0], p[1], SCREEN, SCREEN_R)
                body = cover(d_body) * (1 - cover(d_screen))
                if body > 0:
                    # Borde metalico fino y cuerpo casi negro.
                    rim = d_body > -3.5
                    c = (0.32, 0.33, 0.35) if rim else (0.05, 0.05, 0.06)
                    col = over(col, (*c, body))
                isl = cover(rrect_dist(p[0], p[1], ISLAND, ISLAND[3] / 2))
                if isl > 0:
                    col = over(col, (0.0, 0.0, 0.0, isl))
                # Botones laterales.
                for bx, by, bwid, bhei in ((x0 - 5, y0 + 250, 6, 70), (x0 - 5, y0 + 350, 6, 120), (x0 + bw - 1, y0 + 330, 6, 170)):
                    bc = cover(rrect_dist(p[0], p[1], (bx, by, bwid, bhei), 3))
                    if bc > 0:
                        col = over(col, (0.22, 0.23, 0.25, bc))
                r, g, b, a = col
                i = px * 4
                row[i : i + 4] = bytes((round(r * 255), round(g * 255), round(b * 255), round(a * 255)))
        rows.append(bytes(row))
    return rows


def safe_zones():
    rows = []
    for py in range(H):
        row = bytearray(W * 4)
        for px in range(W):
            bottom = py >= H - 380  # usuario, descripcion y musica
            right = px >= W - 150 and 760 <= py < H - 380  # like, comentar, compartir
            top = py < 140  # pestanas "Siguiendo / Para ti"
            if bottom or right or top:
                i = px * 4
                row[i : i + 4] = bytes((235, 64, 52, 90))
        rows.append(bytes(row))
    return rows


if __name__ == "__main__":
    here = Path(__file__).parent
    write_png(here / "marco-iphone.png", W, H, phone_frame())
    write_png(here / "zonas-seguras.png", W, H, safe_zones())
    print("Listo:", here / "marco-iphone.png", here / "zonas-seguras.png")
