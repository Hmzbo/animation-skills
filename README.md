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
| `motion-canvas` | oss | MIT | TS explanatory videos, animated charts (stub) |
| `threejs` | oss | MIT | GPU 3D: product spins, particles, shaders (stub) |
| `wgpu-shaders` | oss | MIT/Apache-2.0 | Rust GPU shader-art procedurals (stub) |
| `remotion` | source-available | Remotion License | React video: marketing, UI walkthroughs (stub) |
| `gsap-motion` | proprietary-free | GSAP Standard License | Web UI motion, scroll stories (stub) |

**License warnings (read before commercial use):**
- `source-available/` (Remotion) is NOT OSI open-source: https://www.remotion.dev/docs/license
- `proprietary-free/` (GSAP) is gratis but proprietary with a non-compete clause: https://gsap.com/community/standard-license/
- Stubs (`status: stub` in frontmatter) get full content in Phase 2.

Shared render backend: `shared/ffmpeg/` (encode + frame-review recipes every skill reuses).

## Install (flat — required)

Clients expect flat `skills/<name>/SKILL.md`, but this repo nests by license
bucket. Do NOT clone the whole repo into a skills dir. Use the shim:

```bash
python scripts/install.py --list
python scripts/install.py --skill manim --target ~/.config/opencode/skills
python scripts/install.py --all --target ~/.claude/skills
```

Targets: OpenCode project `.opencode/skills/` or global `~/.config/opencode/skills/`,
Claude Code `~/.claude/skills/`, any agentskills client `~/.agents/skills/`.

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
