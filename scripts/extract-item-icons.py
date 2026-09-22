#!/usr/bin/env python3
"""Build a compact item-icon atlas from the exact mod JARs used by the wiki."""

from __future__ import annotations

import io
import json
import math
import re
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parent
DATA_PATH = ROOT / "docs" / "data" / "content.json"
OUTPUT_DIR = ROOT / "docs" / "assets"
ATLAS_PATH = OUTPUT_DIR / "item-icons.webp"
CELL = 64
COLUMNS = 32

JARS = {
    "irons_spellbooks": "irons-spellbooks.jar",
    "aces_spell_utils": "aces.jar",
    "cataclysm_spellbooks": "cataclysm-spellbooks.jar",
    "discerning_the_eldritch": "discerning-eldritch.jar",
    "hazentouvelib": "hazen-lib.jar",
    "hazennstuff": "hazen-n-stuff.jar",
    "iss_magicfromtheeast": "magic-from-east.jar",
    "darkermagic": "darker-magic.jar",
    "darkdoppelganger": "dark-doppelganger.jar",
    "create_wizardry": "create-wizardry.jar",
    "somakespells": "somakespells-1.0.8-1.21.1-fix.jar",
}


def load_json(zf: zipfile.ZipFile, path: str) -> dict | None:
    try:
        return json.loads(zf.read(path))
    except (KeyError, json.JSONDecodeError, UnicodeDecodeError):
        return None


def texture_path(ref: str, default_namespace: str) -> str:
    namespace, _, path = ref.partition(":")
    if not path:
        namespace, path = default_namespace, namespace
    path = path.removeprefix("textures/")
    return f"assets/{namespace}/textures/{path}.png"


def model_textures(zf: zipfile.ZipFile, names: set[str], namespace: str, item_id: str) -> list[str]:
    start = f"assets/{namespace}/models/item/{item_id}.json"
    seen: set[str] = set()
    textures: dict[str, str] = {}

    def visit(path: str) -> None:
        if path in seen or path not in names:
            return
        seen.add(path)
        model = load_json(zf, path) or {}
        textures.update({key: value for key, value in model.get("textures", {}).items() if isinstance(value, str)})
        parent = model.get("parent")
        if not isinstance(parent, str) or parent.startswith("minecraft:"):
            return
        parent_ns, _, parent_path = parent.partition(":")
        if not parent_path:
            parent_ns, parent_path = namespace, parent_ns
        visit(f"assets/{parent_ns}/models/{parent_path}.json")

    visit(start)
    resolved: list[str] = []
    for key in ["layer0", "layer1", "layer2", "layer3", "particle"]:
        ref = textures.get(key)
        guard = 0
        while isinstance(ref, str) and ref.startswith("#") and guard < 8:
            ref = textures.get(ref[1:])
            guard += 1
        if isinstance(ref, str):
            path = texture_path(ref, namespace)
            if path in names and path not in resolved:
                resolved.append(path)
    return resolved


def candidate_textures(names: set[str], namespace: str, item_id: str) -> list[str]:
    direct = f"assets/{namespace}/textures/item/{item_id}.png"
    if direct in names:
        return [direct]
    matches = [
        name for name in names
        if name.startswith(f"assets/{namespace}/textures/item/")
        and name.endswith(f"/{item_id}.png") or name == direct
    ]
    if not matches:
        matches = [
            name for name in names
            if name.startswith(f"assets/{namespace}/textures/")
            and Path(name).name == f"{item_id}.png"
        ]
    matches.sort(key=lambda path: ("glowmask" in path, "_model" in path, "_gui" not in path, len(path)))
    return matches[:3]


def first_frame(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    if image.height > image.width and image.height % image.width == 0:
        return image.crop((0, 0, image.width, image.width))
    return image


def render_icon(zf: zipfile.ZipFile, paths: list[str], label: str, seed: str) -> tuple[Image.Image, bool]:
    layers: list[Image.Image] = []
    for path in paths:
        try:
            layers.append(first_frame(Image.open(io.BytesIO(zf.read(path)))))
        except (KeyError, OSError):
            continue
    canvas = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    if layers:
        for layer in layers:
            layer.thumbnail((48, 48), Image.Resampling.NEAREST)
            x = (CELL - layer.width) // 2
            y = (CELL - layer.height) // 2
            canvas.alpha_composite(layer, (x, y))
        return canvas, True

    hue = sum(ord(char) for char in seed)
    color = (72 + hue % 100, 64 + (hue * 3) % 90, 95 + (hue * 7) % 110, 255)
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((10, 10, 54, 54), radius=8, fill=(*color[:3], 80), outline=color, width=2)
    letter = (label.strip() or "?")[0].upper()
    font = ImageFont.load_default(size=24)
    box = draw.textbbox((0, 0), letter, font=font)
    draw.text(((CELL - (box[2] - box[0])) / 2, (CELL - (box[3] - box[1])) / 2 - 2), letter, fill=(245, 239, 222, 255), font=font)
    return canvas, False


def main() -> None:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    rows = math.ceil(len(data["items"]) / COLUMNS)
    atlas = Image.new("RGBA", (COLUMNS * CELL, rows * CELL), (0, 0, 0, 0))
    opened: dict[str, tuple[zipfile.ZipFile, set[str]]] = {}
    authentic = 0

    try:
        for mod_id, jar_name in JARS.items():
            zf = zipfile.ZipFile(WORKSPACE / "jars" / jar_name)
            opened[mod_id] = (zf, set(zf.namelist()))

        for index, item in enumerate(data["items"]):
            zf, names = opened[item["mod"]]
            namespace, item_id = item["id"].split(":", 1)
            paths = model_textures(zf, names, namespace, item_id)
            if not paths:
                paths = candidate_textures(names, namespace, item_id)
            icon, is_authentic = render_icon(zf, paths, item["name"]["en"], item["id"])
            authentic += int(is_authentic)
            x, y = (index % COLUMNS) * CELL, (index // COLUMNS) * CELL
            atlas.alpha_composite(icon, (x, y))
            item["iconIndex"] = index
            item["iconAuthentic"] = is_authentic
    finally:
        for zf, _ in opened.values():
            zf.close()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    atlas.save(ATLAS_PATH, "WEBP", lossless=True, method=6)
    data.setdefault("meta", {})["itemAtlas"] = {
        "path": "./assets/item-icons.webp",
        "cell": CELL,
        "columns": COLUMNS,
        "width": atlas.width,
        "height": atlas.height,
        "authentic": authentic,
        "total": len(data["items"]),
    }
    DATA_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {ATLAS_PATH.relative_to(ROOT)}: {authentic}/{len(data['items'])} authentic icons")


if __name__ == "__main__":
    main()
