# animation-skills

A monorepo of [Agent Skills](https://agentskills.io) that turn an AI coding agent
into an animation studio: math explainers, code-driven product videos, GPU 3D
motion graphics, and web animation — all generated from code, rendered to MP4.

> Formerly `manim-animator` (single skill). Manim is now `skills/oss/manim/`
> and still works exactly as before.

## Skills

| Skill | Bucket | License | Use for |
|---|---|---|---|
| `manim` | oss | MIT | Math/physics/CS explainer videos (3Blue1Brown style) |
| `motion-canvas` | oss | MIT | TS explanatory videos, animated charts |
| `threejs` | oss | MIT | GPU 3D: product spins, particles, shaders |
| `wgpu-shaders` | oss | MIT/Apache-2.0 | Rust GPU shader-art procedurals |
| `remotion` | source-available | Remotion License | React video: marketing, UI walkthroughs |
| `gsap-motion` | proprietary-free | GSAP Standard License | Web UI motion, scroll stories |

**License warnings (read before commercial use):**
- `source-available/` (Remotion) is NOT OSI open-source: https://www.remotion.dev/docs/license
- `proprietary-free/` (GSAP) is gratis but proprietary with a non-compete clause: https://gsap.com/community/standard-license/
- Stubs (`status: stub` in frontmatter) get full content in Phase 2.

Shared render backend: `shared/ffmpeg/` (encode + frame-review recipes every skill reuses).

## Install

With the skills CLI (recommended — picks up all 6 skills despite the license-bucket nesting):

```bash
npx skills add Hmzbo/animation-skills              # everything
npx skills add Hmzbo/animation-skills -s manim     # one skill: -s motion-canvas|threejs|wgpu-shaders|remotion|gsap-motion
npx skills add Hmzbo/animation-skills -l            # list before installing
```

Add `-g` for a global install, or run inside your project for a project-level one.
Targets are auto-detected: OpenCode (`.opencode/skills/` or `~/.config/opencode/skills/`),
Claude Code (`~/.claude/skills/`), or any agentskills client (`~/.agents/skills/`).

Manual fallback (no npx — plain copy, same flat result):

```bash
python scripts/install.py --list
python scripts/install.py --skill manim --target ~/.config/opencode/skills
python scripts/install.py --all --target ~/.claude/skills
```

## Repo layout

```
skills/oss/manim/            # the original manim-animator skill (full content)
skills/oss|source-available|proprietary-free/<name>/  # stubs -> Phase 2
shared/ffmpeg/               # shared encode recipes
scripts/{install.py,check.py}  # repo tooling
plans/                       # working plans (local-only, gitignored)
animations/ media/           # your render output (gitignored, never commit)
```

## Validate

```bash
python scripts/check.py
uv run skills/oss/manim/scripts/preflight.py
```

## Example prompts (manim, ready now)

- "Animate solving the equation x + 10 = 1 step by step."
- "Make a video explaining integrals as area under a curve, with Riemann rectangles getting finer."
- "Visually explain the Pythagorean theorem."

## License

Repo scaffolding is MIT (`LICENSE`). Each skill dir carries its own `LICENSE`
or `LICENSE.note` with upstream terms — the skill license governs the skill.
