"""Crea en OBS el perfil y la coleccion de escenas "Rumbo Reels" (video vertical 1080x1920).

- Perfil: 1080x1920 a 60 fps, grabacion con NVIDIA NVENC (CQP 18) en MP4 dentro de Videos.
- Escena "Reel": VS Code de fondo, Rumbo (ventana de Edge) dentro del marco de iPhone a la
  izquierda, y una guia oculta de las zonas que tapan Instagram y TikTok.

No modifica perfiles ni escenas existentes. En OBS se eligen desde los menus
Perfil -> Rumbo Reels y Coleccion de escenas -> Rumbo Reels.

Uso: python configurar_obs.py   (con OBS cerrado)
"""
import json
import os
import uuid
from pathlib import Path

HERE = Path(__file__).resolve().parent
OBS = Path(os.environ["APPDATA"]) / "obs-studio" / "basic"
# OBS lee "\\" en sus .ini como escape ("\\rober" se volvia un salto de linea): usar barras normales.
VIDEOS = (Path(os.environ["USERPROFILE"]) / "Videos").as_posix()
NAME = "Rumbo Reels"
SLUG = "Rumbo_Reels"

# Debe coincidir con SCREEN en generar_imagenes.py.
SCREEN = (40, 288, 620, 1344)


def abgr(hex_rgb):
    r, g, b = (int(hex_rgb[i : i + 2], 16) for i in (1, 3, 5))
    return (0xFF << 24) | (b << 16) | (g << 8) | r


def source(name, kind, settings, filters=None):
    data = {
        "name": name,
        "uuid": str(uuid.uuid4()),
        "id": kind,
        "versioned_id": kind,
        "settings": settings,
        "mixers": 0,
        "flags": 0,
        "volume": 1.0,
        "balance": 0.5,
        "enabled": True,
        "muted": True,
        "private_settings": {},
    }
    if filters:
        data["filters"] = filters
    return data


def item(src, item_id, x, y, visible=True, locked=False, bounds=None, bounds_type=0, crop=None):
    left, top, right, bottom = crop or (0, 0, 0, 0)
    return {
        "name": src["name"],
        "source_uuid": src["uuid"],
        "visible": visible,
        "locked": locked,
        "rot": 0.0,
        "pos": {"x": float(x), "y": float(y)},
        "scale": {"x": 1.0, "y": 1.0},
        "align": 5,  # arriba a la izquierda
        "bounds_type": bounds_type,
        "bounds_align": 0,
        "bounds_crop": bounds_type == 3,
        "bounds": {"x": float(bounds[0]), "y": float(bounds[1])} if bounds else {"x": 0.0, "y": 0.0},
        "crop_left": left,
        "crop_top": top,
        "crop_right": right,
        "crop_bottom": bottom,
        "id": item_id,
        "group_item_backup": False,
        "scale_filter": "bicubic",
        "blend_method": "default",
        "blend_type": "normal",
        "show_transition": {"duration": 0},
        "hide_transition": {"duration": 0},
        "private_settings": {},
    }


def write_profile():
    folder = OBS / "profiles" / SLUG
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "basic.ini").write_text(
        "\n".join(
            [
                "[General]",
                f"Name={NAME}",
                "",
                "[Video]",
                "BaseCX=1080",
                "BaseCY=1920",
                "OutputCX=1080",
                "OutputCY=1920",
                "FPSType=0",
                "FPSCommon=60",
                "ScaleType=lanczos",
                "ColorFormat=NV12",
                "ColorSpace=709",
                "ColorRange=Partial",
                "",
                "[Output]",
                "Mode=Advanced",
                "",
                "[AdvOut]",
                "Encoder=obs_nvenc_h264_tex",
                "RecType=Standard",
                "RecEncoder=obs_nvenc_h264_tex",
                f"RecFilePath={VIDEOS}",
                "RecFormat2=fragmented_mp4",
                "RecTracks=1",
                "RecFileNameWithoutSpace=true",
                "",
                "[SimpleOutput]",
                f"FilePath={VIDEOS}",
                "RecFormat2=fragmented_mp4",
                "",
            ]
        ),
        encoding="utf-8",
    )
    (folder / "recordEncoder.json").write_text(
        json.dumps({"rate_control": "CQP", "cqp": 18, "preset2": "p5", "profile": "high", "bf": 2}, indent=4),
        encoding="utf-8",
    )
    return folder


def write_scenes():
    fondo = source("Fondo", "color_source_v3", {"color": abgr("#0B0F14"), "width": 1080, "height": 1920})
    # Prioridad 2: si el titulo cambia (otro archivo abierto), igual busca la ventana de Code.exe.
    codigo = source(
        "Código (VS Code)",
        "window_capture",
        {"window": "Visual Studio Code:Chrome_WidgetWin_1:Code.exe", "priority": 2, "method": 2, "client_area": True, "cursor": True},
    )
    # La ventana de Rumbo la abre "abrir-rumbo-telefono.cmd" con el titulo "Rumbo".
    app = source(
        "Rumbo (teléfono)",
        "window_capture",
        {"window": "Rumbo:Chrome_WidgetWin_1:msedge.exe", "priority": 1, "method": 2, "client_area": True, "cursor": True},
    )
    marco = source("Marco iPhone", "image_source", {"file": str(HERE / "marco-iphone.png")})
    guia = source("Guía zonas seguras (no grabar)", "image_source", {"file": str(HERE / "zonas-seguras.png")})

    x, y, w, h = SCREEN
    items = [
        item(fondo, 1, 0, 0, locked=True),
        # VS Code a la altura completa, corrido a la derecha: el codigo asoma junto al telefono.
        # Se recorta la barra de actividad (48 px) de la izquierda.
        item(codigo, 2, 600, 0, bounds=(4000, 1920), bounds_type=5, crop=(48, 0, 0, 0)),
        # Rumbo llena exactamente la pantalla del marco (escala y recorta lo que sobre).
        # Se recortan los 38 px de la barra de titulo que Edge dibuja dentro de la ventana (pantalla al 125 %).
        item(app, 3, x, y, bounds=(w, h), bounds_type=3, crop=(0, 38, 0, 0)),
        item(marco, 4, 0, 0, locked=True),
        item(guia, 5, 0, 0, visible=False, locked=True),
    ]
    scene = source("Reel", "scene", {"id_counter": len(items), "custom_size": False, "items": items})
    scene["muted"] = False

    collection = {
        "name": NAME,
        "sources": [scene, fondo, codigo, app, marco, guia],
        "groups": [],
        "scene_order": [{"name": "Reel"}],
        "current_scene": "Reel",
        "current_program_scene": "Reel",
        "current_transition": "Corte",
        "transition_duration": 300,
        "transitions": [],
        "quick_transitions": [],
        "saved_projectors": [],
        "preview_locked": False,
        "scaling_enabled": False,
        "modules": {},
        "version": 2,
    }
    path = OBS / "scenes" / f"{SLUG}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(collection, indent=4, ensure_ascii=False), encoding="utf-8")
    return path


if __name__ == "__main__":
    print("Perfil:", write_profile())
    print("Escenas:", write_scenes())
