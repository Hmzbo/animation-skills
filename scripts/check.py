"""Validate the animation-skills monorepo structure.

Checks:
- no root-level SKILL.md (monorepo, not a single skill)
- every skills/<bucket>/<name>/SKILL.md has frontmatter:
  name, description, license, compatibility
- every skill dir has LICENSE or LICENSE.note
- manim skill relative links resolve (references/, examples/, scripts/)
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REQUIRED_FM = ("name", "description", "license", "compatibility")


def parse_frontmatter(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.DOTALL)
    if not m:
        return {}
    fm = {}
    for line in m.group(1).splitlines():
        if ":" in line and not line.startswith((" ", "\t")):
            k, v = line.split(":", 1)
            fm[k.strip()] = v.strip()
    return fm


def main() -> int:
    errors = []

    if (ROOT / "SKILL.md").exists():
        errors.append("root SKILL.md must not exist (monorepo now)")

    skill_files = sorted((ROOT / "skills").glob("*/*/SKILL.md"))
    if not skill_files:
        errors.append("no skills found under skills/*/*/SKILL.md")

    for sf in skill_files:
        d = sf.parent
        fm = parse_frontmatter(sf)
        for key in REQUIRED_FM:
            if not fm.get(key):
                errors.append(f"{sf.relative_to(ROOT)}: frontmatter missing '{key}'")
        if not ((d / "LICENSE").exists() or (d / "LICENSE.note").exists()):
            errors.append(f"{d.relative_to(ROOT)}: missing LICENSE or LICENSE.note")

    manim = ROOT / "skills" / "oss" / "manim"
    for sub in ("references", "examples", "scripts"):
        if not (manim / sub).is_dir():
            errors.append(f"skills/oss/manim: missing {sub}/ (relative links would break)")
    for f in ("references/creative-direction.md", "references/manim-api.md",
              "references/troubleshooting.md", "examples/README.md",
              "scripts/preflight.py", "scripts/stitch.py"):
        if not (manim / f).exists():
            errors.append(f"skills/oss/manim: missing {f}")

    if errors:
        print("check FAILED:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print(f"check OK: {len(skill_files)} skills validated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
