"""Flat-install skills from this monorepo into an agent's skills directory.

Source of truth is nested (skills/<bucket>/<name>/SKILL.md) but clients
(Claude Code, OpenCode) expect flat skills dirs, so this copies
skills/*/<name> -> <target>/<name>.

Usage:
  python scripts/install.py --list
  python scripts/install.py --skill manim --target ~/.config/opencode/skills
  python scripts/install.py --all --target ~/.claude/skills
"""

import argparse
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILLS_DIR = ROOT / "skills"


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


def discover() -> list:
    found = []
    for skill_file in sorted(SKILLS_DIR.glob("*/*/SKILL.md")):
        bucket = skill_file.parent.parent.name
        fm = parse_frontmatter(skill_file)
        found.append({
            "name": fm.get("name", skill_file.parent.name),
            "bucket": bucket,
            "license": fm.get("license", "unknown"),
            "path": skill_file.parent,
        })
    return found


def cmd_list(skills: list) -> int:
    print(f"{'skill':<16}{'bucket':<20}{'license'}")
    for s in skills:
        print(f"{s['name']:<16}{s['bucket']:<20}{s['license']}")
    return 0


def install_one(skill: dict, target: Path) -> None:
    dest = target / skill["name"]
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(skill["path"], dest)
    print(f"installed {skill['name']} [{skill['bucket']}] -> {dest}")


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Install animation-skills into an agent skills dir")
    ap.add_argument("--list", action="store_true", help="list available skills")
    ap.add_argument("--skill", help="skill name to install")
    ap.add_argument("--all", action="store_true", help="install every skill")
    ap.add_argument("--target", help="flat target skills directory")
    args = ap.parse_args(argv)

    skills = discover()
    if args.list or (not args.skill and not args.all):
        return cmd_list(skills)

    if not args.target:
        print("error: --target <dir> is required", file=sys.stderr)
        return 2
    target = Path(args.target).expanduser()

    if args.all:
        for s in skills:
            install_one(s, target)
        return 0

    match = [s for s in skills if s["name"] == args.skill]
    if not match:
        print(f"error: unknown skill '{args.skill}'", file=sys.stderr)
        return 2
    install_one(match[0], target)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
