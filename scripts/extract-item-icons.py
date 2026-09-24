#!/usr/bin/env python3
"""Build a compact item-icon atlas from the exact mod JARs used by the wiki."""

from __future__ import annotations

import io
import json
import math
import re
import zipfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFont


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


def item_model(zf: zipfile.ZipFile, names: set[str], namespace: str, item_id: str) -> dict:
    path = f"assets/{namespace}/models/item/{item_id}.json"
    return load_json(zf, path) if path in names else {}


def resolved_item_model(zf: zipfile.ZipFile, names: set[str], namespace: str, item_id: str) -> dict:
    """Resolve custom JSON parents while preserving child textures/display overrides."""
    path = f"assets/{namespace}/models/item/{item_id}.json"
    seen: set[str] = set()
    chain: list[dict] = []
    while path in names and path not in seen:
        seen.add(path)
        model = load_json(zf, path) or {}
        chain.append(model)
        parent = model.get("parent")
        if not isinstance(parent, str) or parent.startswith("minecraft:"):
            break
        parent_ns, _, parent_path = parent.partition(":")
        if not parent_path:
            parent_ns, parent_path = namespace, parent_ns
        path = f"assets/{parent_ns}/models/{parent_path}.json"
    merged: dict = {}
    for model in reversed(chain):
        for key, value in model.items():
            if key in {"textures", "display"}:
                merged[key] = {**merged.get(key, {}), **value}
            else:
                merged[key] = value
    return merged


def geo_path(names: set[str], namespace: str, item_id: str) -> str | None:
    matches = [
        name for name in names
        if name.startswith(f"assets/{namespace}/geo/")
        and name.endswith(f"/{item_id}.geo.json")
    ]
    return min(matches, key=lambda value: ("/item/" not in value, len(value)), default=None)


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


def rotation_matrix(rotation: list[float] | tuple[float, float, float]) -> np.ndarray:
    x, y, z = np.radians(np.asarray(rotation, dtype=float))
    rx = np.array([[1, 0, 0, 0], [0, np.cos(x), -np.sin(x), 0], [0, np.sin(x), np.cos(x), 0], [0, 0, 0, 1]])
    ry = np.array([[np.cos(y), 0, np.sin(y), 0], [0, 1, 0, 0], [-np.sin(y), 0, np.cos(y), 0], [0, 0, 0, 1]])
    rz = np.array([[np.cos(z), -np.sin(z), 0, 0], [np.sin(z), np.cos(z), 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]])
    return rz @ ry @ rx


def around_pivot(pivot: list[float], rotation: list[float]) -> np.ndarray:
    before = np.identity(4)
    after = np.identity(4)
    before[:3, 3] = -np.asarray(pivot, dtype=float)
    after[:3, 3] = np.asarray(pivot, dtype=float)
    return after @ rotation_matrix(rotation) @ before


def face_uv(cube: dict, face: str, dimensions: tuple[float, float, float]) -> tuple[float, float, float, float]:
    uv = cube.get("uv", [0, 0])
    if isinstance(uv, dict):
        spec = uv.get(face, {})
        start = spec.get("uv", [0, 0])
        size = spec.get("uv_size", [1, 1])
        return start[0], start[1], start[0] + abs(size[0]), start[1] + abs(size[1])
    u, v = uv if isinstance(uv, list) and len(uv) >= 2 else (0, 0)
    dx, dy, dz = dimensions
    boxes = {
        "west": (u, v + dz, u + max(dz, 1), v + dz + max(dy, 1)),
        "north": (u + dz, v + dz, u + dz + max(dx, 1), v + dz + max(dy, 1)),
        "east": (u + dz + dx, v + dz, u + 2 * dz + dx, v + dz + max(dy, 1)),
        "south": (u + 2 * dz + dx, v + dz, u + 2 * dz + 2 * dx, v + dz + max(dy, 1)),
        "up": (u + dz, v, u + dz + max(dx, 1), v + max(dz, 1)),
        "down": (u + dz + dx, v, u + dz + 2 * dx, v + max(dz, 1)),
    }
    return boxes[face]


def paste_affine_face(canvas: Image.Image, texture: Image.Image, polygon: list[tuple[float, float]], uv: tuple[float, float, float, float], shade: float) -> None:
    if abs(sum(polygon[n][0] * polygon[(n + 1) % 4][1] - polygon[(n + 1) % 4][0] * polygon[n][1] for n in range(4))) < 1:
        return
    left, top, right, bottom = uv
    left, top = max(0, int(np.floor(left))), max(0, int(np.floor(top)))
    right, bottom = min(texture.width, max(left + 1, int(np.ceil(right)))), min(texture.height, max(top + 1, int(np.ceil(bottom))))
    patch = texture.crop((left, top, right, bottom))
    if shade != 1:
        patch = ImageEnhance.Brightness(patch).enhance(shade)
    p0, p1, _, p3 = polygon
    matrix = np.array([[p0[0], p0[1], 1], [p1[0], p1[1], 1], [p3[0], p3[1], 1]], dtype=float)
    try:
        u_coeff = np.linalg.solve(matrix, np.array([0, patch.width - 1, 0], dtype=float))
        v_coeff = np.linalg.solve(matrix, np.array([0, 0, patch.height - 1], dtype=float))
    except np.linalg.LinAlgError:
        return
    warped = patch.transform(
        canvas.size,
        Image.Transform.AFFINE,
        (u_coeff[0], u_coeff[1], u_coeff[2], v_coeff[0], v_coeff[1], v_coeff[2]),
        resample=Image.Resampling.NEAREST,
    )
    mask = Image.new("L", canvas.size)
    ImageDraw.Draw(mask).polygon(polygon, fill=255)
    if warped.getchannel("A").getbbox():
        mask = Image.fromarray(np.minimum(np.asarray(mask), np.asarray(warped.getchannel("A"))).astype(np.uint8))
    canvas.alpha_composite(Image.composite(warped, Image.new("RGBA", canvas.size), mask))


def render_geo_icon(zf: zipfile.ZipFile, path: str, texture_path_value: str, model: dict) -> Image.Image | None:
    geo = load_json(zf, path) or {}
    geometries = geo.get("minecraft:geometry", [])
    if not geometries:
        return None
    geometry = geometries[0]
    bones = geometry.get("bones", [])
    if not bones:
        return None
    try:
        texture = first_frame(Image.open(io.BytesIO(zf.read(texture_path_value))))
    except (KeyError, OSError):
        return None

    by_name = {bone.get("name"): bone for bone in bones}
    transforms: dict[str, np.ndarray] = {}

    def bone_transform(bone: dict) -> np.ndarray:
        name = bone.get("name", "")
        if name in transforms:
            return transforms[name]
        own = around_pivot(bone.get("pivot", [0, 0, 0]), bone.get("rotation", [0, 0, 0]))
        parent = by_name.get(bone.get("parent"))
        transforms[name] = bone_transform(parent) @ own if parent else own
        return transforms[name]

    raw_faces = []
    face_indices = {
        "north": (0, 1, 3, 2), "south": (4, 6, 7, 5),
        "west": (0, 2, 6, 4), "east": (1, 5, 7, 3),
        "down": (0, 4, 5, 1), "up": (2, 3, 7, 6),
    }
    gui_rotation = model.get("display", {}).get("gui", {}).get("rotation", [22, -32, -35])
    view = rotation_matrix([22 + gui_rotation[0], -32 + gui_rotation[1], gui_rotation[2]])
    all_points = []
    for bone in bones:
        base = bone_transform(bone)
        for cube in bone.get("cubes", []):
            origin = np.asarray(cube.get("origin", [0, 0, 0]), dtype=float)
            size = np.asarray(cube.get("size", [1, 1, 1]), dtype=float)
            inflate = float(cube.get("inflate", 0))
            lo, hi = origin - inflate, origin + size + inflate
            corners = np.array([
                [lo[0], lo[1], lo[2], 1], [hi[0], lo[1], lo[2], 1],
                [lo[0], hi[1], lo[2], 1], [hi[0], hi[1], lo[2], 1],
                [lo[0], lo[1], hi[2], 1], [hi[0], lo[1], hi[2], 1],
                [lo[0], hi[1], hi[2], 1], [hi[0], hi[1], hi[2], 1],
            ])
            cube_matrix = around_pivot(cube.get("pivot", bone.get("pivot", [0, 0, 0])), cube.get("rotation", [0, 0, 0]))
            points = (view @ base @ cube_matrix @ corners.T).T[:, :3]
            all_points.extend(points)
            for face, indices in face_indices.items():
                face_points = points[list(indices)]
                raw_faces.append((float(face_points[:, 2].mean()), face, face_points, face_uv(cube, face, tuple(size))))
    if not all_points:
        return None
    all_points = np.asarray(all_points)
    width = max(float(np.ptp(all_points[:, 0])), .1)
    height = max(float(np.ptp(all_points[:, 1])), .1)
    scale = min(224 / width, 224 / height)
    center = np.array([(all_points[:, 0].min() + all_points[:, 0].max()) / 2, (all_points[:, 1].min() + all_points[:, 1].max()) / 2])
    canvas = Image.new("RGBA", (256, 256))
    shade_by_face = {"up": 1.1, "down": .58, "north": .9, "south": .78, "west": .68, "east": 1.0}
    for _, face, points, uv in sorted(raw_faces, key=lambda entry: entry[0]):
        polygon = [((point[0] - center[0]) * scale + 128, 128 - (point[1] - center[1]) * scale) for point in points]
        paste_affine_face(canvas, texture, polygon, uv, shade_by_face[face])
    return canvas.resize((CELL, CELL), Image.Resampling.LANCZOS)


def render_element_icon(zf: zipfile.ZipFile, model: dict, namespace: str) -> Image.Image | None:
    """Render vanilla/Blockbench item-model elements into an isometric atlas icon."""
    elements = model.get("elements", [])
    if not elements:
        return None
    textures: dict[str, Image.Image] = {}
    refs = model.get("textures", {})
    for key, ref in refs.items():
        guard = 0
        while isinstance(ref, str) and ref.startswith("#") and guard < 8:
            ref = refs.get(ref[1:])
            guard += 1
        if isinstance(ref, str):
            try:
                textures[key] = first_frame(Image.open(io.BytesIO(zf.read(texture_path(ref, namespace)))))
            except (KeyError, OSError):
                pass
    if not textures:
        return None
    face_indices = {
        "north": (0, 1, 3, 2), "south": (4, 6, 7, 5),
        "west": (0, 2, 6, 4), "east": (1, 5, 7, 3),
        "down": (0, 4, 5, 1), "up": (2, 3, 7, 6),
    }
    gui = model.get("display", {}).get("gui", {})
    view = rotation_matrix(gui.get("rotation", [30, 225, 0]))
    raw_faces, all_points = [], []
    for element in elements:
        lo = np.asarray(element.get("from", [0, 0, 0]), dtype=float)
        hi = np.asarray(element.get("to", [16, 16, 16]), dtype=float)
        corners = np.array([
            [lo[0], lo[1], lo[2], 1], [hi[0], lo[1], lo[2], 1],
            [lo[0], hi[1], lo[2], 1], [hi[0], hi[1], lo[2], 1],
            [lo[0], lo[1], hi[2], 1], [hi[0], lo[1], hi[2], 1],
            [lo[0], hi[1], hi[2], 1], [hi[0], hi[1], hi[2], 1],
        ])
        rot = element.get("rotation", {})
        transform = np.identity(4)
        if rot:
            angles = [0, 0, 0]
            angles[{"x": 0, "y": 1, "z": 2}.get(rot.get("axis"), 1)] = rot.get("angle", 0)
            transform = around_pivot(rot.get("origin", [8, 8, 8]), angles)
        points = (view @ transform @ corners.T).T[:, :3]
        all_points.extend(points)
        for face, spec in element.get("faces", {}).items():
            if face not in face_indices:
                continue
            key = str(spec.get("texture", "#particle")).lstrip("#")
            texture = textures.get(key) or textures.get("particle") or next(iter(textures.values()))
            uv = spec.get("uv", [0, 0, 16, 16])
            # Vanilla model UVs use a logical 16×16 canvas.
            uv = tuple(float(v) * texture.width / 16 for v in uv)
            face_points = points[list(face_indices[face])]
            raw_faces.append((float(face_points[:, 2].mean()), face, face_points, uv, texture))
    if not all_points:
        return None
    all_points = np.asarray(all_points)
    scale = min(224 / max(float(np.ptp(all_points[:, 0])), .1), 224 / max(float(np.ptp(all_points[:, 1])), .1))
    center = np.array([(all_points[:, 0].min() + all_points[:, 0].max()) / 2, (all_points[:, 1].min() + all_points[:, 1].max()) / 2])
    canvas = Image.new("RGBA", (256, 256))
    shade = {"up": 1.1, "down": .58, "north": .9, "south": .78, "west": .68, "east": 1.0}
    for _, face, points, uv, texture in sorted(raw_faces, key=lambda entry: entry[0]):
        polygon = [((p[0] - center[0]) * scale + 128, 128 - (p[1] - center[1]) * scale) for p in points]
        paste_affine_face(canvas, texture, polygon, uv, shade[face])
    return canvas.resize((CELL, CELL), Image.Resampling.LANCZOS)


def render_icon(zf: zipfile.ZipFile, paths: list[str], label: str, seed: str, model: dict | None = None, geo: str | None = None, namespace: str = "minecraft") -> tuple[Image.Image, bool, bool]:
    if geo and paths:
        rendered = render_geo_icon(zf, geo, paths[0], model or {})
        if rendered is not None:
            return rendered, True, True
    if model and model.get("elements"):
        rendered = render_element_icon(zf, model, namespace)
        if rendered is not None:
            return rendered, True, True
    layers: list[Image.Image] = []
    for path in paths:
        try:
            layers.append(first_frame(Image.open(io.BytesIO(zf.read(path)))))
        except (KeyError, OSError):
            continue
    canvas = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    if layers:
        for layer in layers:
            # Minecraft item textures are commonly 16×16. `thumbnail()` only
            # shrinks images, leaving those originals tiny inside a 64px atlas
            # cell. Animated textures are vertical strips, so use their first
            # square frame before scaling every layer up to the same 48px box.
            if layer.height > layer.width and layer.height % layer.width == 0:
                layer = layer.crop((0, 0, layer.width, layer.width))
            scale = min(48 / layer.width, 48 / layer.height)
            target = (
                max(1, round(layer.width * scale)),
                max(1, round(layer.height * scale)),
            )
            layer = layer.resize(target, Image.Resampling.NEAREST)
            x = (CELL - layer.width) // 2
            y = (CELL - layer.height) // 2
            canvas.alpha_composite(layer, (x, y))
        return canvas, True, False

    hue = sum(ord(char) for char in seed)
    color = (72 + hue % 100, 64 + (hue * 3) % 90, 95 + (hue * 7) % 110, 255)
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((10, 10, 54, 54), radius=8, fill=(*color[:3], 80), outline=color, width=2)
    letter = (label.strip() or "?")[0].upper()
    font = ImageFont.load_default(size=24)
    box = draw.textbbox((0, 0), letter, font=font)
    draw.text(((CELL - (box[2] - box[0])) / 2, (CELL - (box[3] - box[1])) / 2 - 2), letter, fill=(245, 239, 222, 255), font=font)
    return canvas, False, False


def main() -> None:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    rows = math.ceil(len(data["items"]) / COLUMNS)
    atlas = Image.new("RGBA", (COLUMNS * CELL, rows * CELL), (0, 0, 0, 0))
    opened: dict[str, tuple[zipfile.ZipFile, set[str]]] = {}
    authentic = 0
    model_rendered = 0

    try:
        for mod_id, jar_name in JARS.items():
            zf = zipfile.ZipFile(WORKSPACE / "jars" / jar_name)
            opened[mod_id] = (zf, set(zf.namelist()))

        for index, item in enumerate(data["items"]):
            zf, names = opened[item["mod"]]
            namespace, item_id = item["id"].split(":", 1)
            model = resolved_item_model(zf, names, namespace, item_id)
            paths = model_textures(zf, names, namespace, item_id)
            if not paths:
                paths = candidate_textures(names, namespace, item_id)
            geo = geo_path(names, namespace, item_id) if model.get("parent") == "builtin/entity" else None
            icon, is_authentic, is_model_rendered = render_icon(zf, paths, item["name"]["en"], item["id"], model, geo, namespace)
            authentic += int(is_authentic)
            model_rendered += int(is_model_rendered)
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
        "path": "./assets/item-icons.webp?v=20260924-1",
        "cell": CELL,
        "columns": COLUMNS,
        "width": atlas.width,
        "height": atlas.height,
        "authentic": authentic,
        "modelRendered": model_rendered,
        "total": len(data["items"]),
    }
    DATA_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {ATLAS_PATH.relative_to(ROOT)}: {authentic}/{len(data['items'])} authentic icons, {model_rendered} rendered models")


if __name__ == "__main__":
    main()
