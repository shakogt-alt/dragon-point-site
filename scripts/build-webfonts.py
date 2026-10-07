"""Lossless webfont delivery shards; retain all original character coverage.

Run with fonttools==4.66.1 and brotli==1.2.0. Originals and OFL files remain in
src/assets/fonts. Keep hinting, metrics and all OpenType layout feature closure.
"""
from pathlib import Path
import hashlib
import json
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "public/fonts"
DEST.mkdir(parents=True, exist_ok=True)
SOURCES = ROOT / "src/assets/fonts"
manifest = {"assets": [], "sources": [], "coverage": []}
previous_path = SOURCES / "web-manifest.json"
previous = json.loads(previous_path.read_text(encoding="utf-8")) if previous_path.exists() else {"assets": []}
faces = []

def sha(data):
    return hashlib.sha256(data).hexdigest()

def ranges(points):
    spans = []
    for point in sorted(points):
        if spans and point == spans[-1][1] + 1:
            spans[-1][1] = point
        else:
            spans.append([point, point])
    return ",".join(f"U+{a:04X}" if a == b else f"U+{a:04X}-{b:04X}" for a, b in spans)

def group(point):
    if point <= 0xFF or 0x300 <= point <= 0x36F or 0x2000 <= point <= 0x26FF or 0xFB00 <= point <= 0xFB06:
        return "common"
    if 0x100 <= point <= 0x2FF or 0x1E00 <= point <= 0x1EFF:
        return "latin-extended"
    if 0x400 <= point <= 0x52F or 0x1C80 <= point <= 0x1C8F:
        return "cyrillic"
    if 0x10A0 <= point <= 0x10FF or 0x1C90 <= point <= 0x1CBF or 0x2D00 <= point <= 0x2D2F:
        return "georgian"
    if 0x590 <= point <= 0x5FF or 0xFB1D <= point <= 0xFB4F:
        return "hebrew"
    return "extended"

def emit(font, family, weight, name, points=None):
    temporary = DEST / f"{name}.woff2"
    font.flavor = "woff2"
    font.save(temporary)
    data = temporary.read_bytes()
    filename = f"{name}.{sha(data)[:12]}.woff2"
    target = DEST / filename
    if target.exists():
        assert target.read_bytes() == data
    temporary.replace(target)
    url = f"/fonts/{filename}"
    manifest["assets"].append({"family": family, "weight": weight, "name": name,
                               "url": url, "bytes": len(data), "sha256": sha(data)})
    face = f'@font-face {{\n  font-family: "{family}";\n  src: url("{url}") format("woff2");\n  font-weight: {weight};\n  font-style: normal;\n  font-display: swap;\n'
    if points is not None:
        face += f"  unicode-range: {ranges(points)};\n"
    faces.append(face + "}")

for label, weight in [("Regular", "400"), ("Medium", "500"), ("SemiBold", "600"), ("Bold", "700")]:
    path = SOURCES / f"FiraGO-{label}.woff2"
    original = TTFont(path, recalcTimestamp=False)
    cmap = original.getBestCmap()
    manifest["sources"].append({"file": str(path.relative_to(ROOT)).replace("\\", "/"),
                                "bytes": path.stat().st_size, "sha256": sha(path.read_bytes())})
    covered = set()
    for part in ["common", "latin-extended", "cyrillic", "georgian", "hebrew", "extended"]:
        points = {point for point in cmap if group(point) == part}
        font = TTFont(path, recalcTimestamp=False)
        options = subset.Options()
        options.layout_features = ["*"]
        options.name_IDs = ["*"]
        options.name_languages = ["*"]
        options.name_legacy = True
        options.glyph_names = True
        options.notdef_outline = True
        subsetter = subset.Subsetter(options=options)
        subsetter.populate(unicodes=points)
        subsetter.subset(font)
        derived = font.getBestCmap()
        assert set(derived) == points
        for point in points:
            before, after = cmap[point], derived[point]
            assert original["hmtx"][before] == font["hmtx"][after]
            a = original["glyf"][before].getCoordinates(original["glyf"])
            b = font["glyf"][after].getCoordinates(font["glyf"])
            assert list(a[0]) == list(b[0]) and list(a[1]) == list(b[1]) and list(a[2]) == list(b[2])
        covered.update(points)
        emit(font, "FiraGO", weight, f"firago-{part}-{weight}", points)
    assert covered == set(cmap)
    manifest["coverage"].append({"weight": weight, "sourceCharacters": len(cmap),
                                 "deliveredCharacters": len(covered), "outlinesAndAdvancesIdentical": True})
    # Keep punctuation/Latin/marks and the active script in one physical face.
    for locale, script in [("ka", "georgian"), ("ru", "cyrillic")]:
        points = {point for point in cmap if group(point) in {"common", "latin-extended", script}}
        font = TTFont(path, recalcTimestamp=False)
        options = subset.Options()
        options.layout_features = ["*"]
        options.name_IDs = ["*"]
        options.name_languages = ["*"]
        options.name_legacy = True
        options.glyph_names = True
        options.notdef_outline = True
        subsetter = subset.Subsetter(options=options)
        subsetter.populate(unicodes=points)
        subsetter.subset(font)
        derived = font.getBestCmap()
        assert set(derived) == points
        for point in points:
            before, after = cmap[point], derived[point]
            assert original["hmtx"][before] == font["hmtx"][after]
            a = original["glyf"][before].getCoordinates(original["glyf"])
            b = font["glyf"][after].getCoordinates(font["glyf"])
            assert list(a[0]) == list(b[0]) and list(a[1]) == list(b[1]) and list(a[2]) == list(b[2])
        emit(font, f"FiraGO {locale.upper()}", weight, f"firago-dictionary-{locale}-{weight}", points)

noto = SOURCES / "hebrew/NotoSansHebrew-Variable.ttf"
manifest["sources"].append({"file": str(noto.relative_to(ROOT)).replace("\\", "/"),
                            "bytes": noto.stat().st_size, "sha256": sha(noto.read_bytes())})
emit(TTFont(noto, recalcTimestamp=False), "Noto Sans Hebrew", "100 900", "noto-sans-hebrew-variable")

# Unrestricted enquiry text may mix scripts/combining marks within a shaping run.
# Keep its original face intact and load it on demand, rather than splitting runs.
input_data = (SOURCES / "FiraGO-Regular.woff2").read_bytes()
input_name = f"firago-input-complete-400.{sha(input_data)[:12]}.woff2"
input_target = DEST / input_name
if input_target.exists():
    assert input_target.read_bytes() == input_data
input_target.write_bytes(input_data)
input_url = f"/fonts/{input_name}"
manifest["assets"].append({"family": "FiraGO Input", "weight": "400", "name": "firago-input-complete-400",
                           "url": input_url, "bytes": len(input_data), "sha256": sha(input_data)})
faces.append(f'@font-face {{\n  font-family: "FiraGO Input";\n  src: url("{input_url}") format("woff2");\n  font-weight: 400;\n  font-style: normal;\n  font-display: swap;\n}}')

# Preserve the exact metric-adjusted Arial fallbacks emitted by the Phase 6
# next/font/local build. These font-wide values are unchanged by delivery shards.
faces.extend([
    '@font-face {\n  font-family: "FiraGO Fallback";\n  src: local("Arial");\n  ascent-override: 91.34%;\n  descent-override: 25.89%;\n  line-gap-override: 0%;\n  size-adjust: 102.36%;\n}',
    '@font-face {\n  font-family: "Noto Hebrew Fallback";\n  src: local("Arial");\n  ascent-override: 108.4%;\n  descent-override: 29.64%;\n  line-gap-override: 0%;\n  size-adjust: 98.53%;\n}',
])
(ROOT / "src/styles/fonts.css").write_text("/* Generated by scripts/build-webfonts.py; retain OFL source notices. */\n" + "\n\n".join(faces) + "\n", encoding="utf-8")
(SOURCES / "web-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
current_urls = {asset["url"] for asset in manifest["assets"]}
for asset in previous["assets"]:
    if asset["url"] in current_urls:
        continue
    old_path = (ROOT / "public" / asset["url"].lstrip("/")).resolve()
    assert old_path.parent == DEST.resolve() and old_path.suffix == ".woff2"
    if old_path.is_file():
        # Delete only the obsolete leaf recorded in the previous generated manifest.
        assert sha(old_path.read_bytes()) == asset["sha256"]
        old_path.unlink()
print(json.dumps(manifest["assets"], indent=2))
