#!/usr/bin/env python3
"""Preflight environment checker for the manim-animator skill.

Verifies, in order:
  1. uv is installed (hard requirement)
  2. manim runs through `uv run --with manim` (auto-provisioned on first run)
  3. LaTeX availability (optional; needed for MathTex/Tex)
  4. ffmpeg availability (optional; only for stitching separate clips)

Exit codes: 0 = ready (with optional warnings), 1 = blocking problem.
Stdlib only. Run it with: uv run scripts/preflight.py
"""

import os
import shutil
import subprocess
import sys
import time

IS_WINDOWS = os.name == "nt"
UV_INSTALL_WIN = 'powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"'
UV_INSTALL_UNIX = "curl -LsSf https://astral.sh/uv/install.sh | sh"

results = []


def record(label, status, detail):
    results.append((label, status, detail))
    mark = {"PASS": "[PASS]", "WARN": "[WARN]", "FAIL": "[FAIL]"}[status]
    print(f"{mark} {label}: {detail}")


def run(cmd, timeout=60):
    try:
        p = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout,
            shell=(IS_WINDOWS and isinstance(cmd, str)),
        )
        return p.returncode, (p.stdout or "") + (p.stderr or "")
    except FileNotFoundError:
        return 127, ""
    except subprocess.TimeoutExpired:
        return 124, ""


def main():
    # 1. uv
    t0 = time.time()
    rc, out = run(["uv", "--version"])
    if rc != 0 or "uv" not in out:
        install_cmd = UV_INSTALL_WIN if IS_WINDOWS else UV_INSTALL_UNIX
        record("uv", "FAIL", f"not found. Install it with: {install_cmd} "
                             "(do NOT fall back to pip/conda)")
        print("\nVERDICT: BLOCKED - install uv, reopen the terminal, rerun.")
        sys.exit(1)
    record("uv", "PASS", out.strip().splitlines()[0])

    # 2. manim via ephemeral uv environment (cached after first download)
    print("      checking manim via `uv run --with manim` "
          "(first run downloads packages, may take minutes)...")
    probe = (
        "import manim, sys; "
        "print(manim.__version__); "
        "print('py%d.%d' % sys.version_info[:2])"
    )
    rc, out = run(["uv", "run", "--with", "manim", "python", "-c", probe],
                  timeout=1800)
    version_line = ""
    if rc == 0:
        lines = [l for l in out.splitlines() if l.strip()]
        version_line = lines[0].strip() if lines else "?"
        record("manim", "PASS",
               f"v{version_line} via uv ({time.time() - t0:.1f}s)")
    elif rc == 124:
        record("manim", "FAIL", "timed out while downloading - retry with network access")
    else:
        tail = "\n".join(out.strip().splitlines()[-6:]) or "(no output)"
        record("manim", "FAIL", f"could not import through uv:\n{tail}")

    # 3. LaTeX (optional)
    latex_bin = shutil.which("latex") or shutil.which("xelatex")
    if latex_bin:
        rc, out = run([latex_bin, "--version"], timeout=30)
        first = (out or "").strip().splitlines()[0] if out else latex_bin
        record("latex", "PASS", f"{first}")
        math_note = ("MathTex/Tex available.")
    else:
        record("latex", "WARN",
               "not found - MathTex/Tex will fail. Avoid them: use Text(), geometry, "
               "and color instead of equations, and tell the user. "
               + ("Install MiKTeX from https://miktex.org" if IS_WINDOWS
                  else "Install TeX Live (linux) or MacTeX-no-GUI (macOS)"))

    # 4. ffmpeg (optional)
    ff_bin = shutil.which("ffmpeg")
    if ff_bin:
        rc, out = run(["ffmpeg", "-version"], timeout=30)
        first = (out or "").splitlines()[0][:80] if out else ff_bin
        record("ffmpeg", "PASS", first)
    else:
        record("ffmpeg", "WARN",
               "not found - multi-clip stitching will use the slower pyav fallback")

    print()
    blocked = any(s == "FAIL" for _, s, _ in results)
    warns = [l for l, s, _ in results if s == "WARN"]
    if blocked:
        print(f"VERDICT: BLOCKED ({time.time() - t0:.0f}s) - fix FAIL items above, rerun.")
        sys.exit(1)
    if warns:
        print(f"VERDICT: READY with {len(warns)} limitation(s) ({time.time() - t0:.0f}s).")
        for w in warns:
            print(f"   note -> {w.split(' - ')[0]}")
        if not latex_bin:
            print("   strategy: no-equation visuals (Text + geometry)")
    else:
        print(f"VERDICT: FULLY READY ({time.time() - t0:.0f}s).")
    sys.exit(0)


if __name__ == "__main__":
    main()
