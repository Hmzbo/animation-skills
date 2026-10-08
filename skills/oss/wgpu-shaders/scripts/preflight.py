#!/usr/bin/env python3
"""Preflight for the wgpu-shaders skill: cargo/rustc/ffmpeg presence + versions.

Run: python <skill-dir>/scripts/preflight.py
GPU adapter availability is checked at render time by the renderer itself
(it prints the adapter name/backend on every run).
"""
import shutil
import subprocess
import sys

failures = 0


def check(label, cmd, min_major=None):
    global failures
    exe = shutil.which(cmd[0])
    if not exe:
        failures += 1
        print(f"FAIL {label}: {cmd[0]} not on PATH")
        return
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        first = (out.stdout or out.stderr).strip().splitlines()[0]
        print(f"ok   {label} ({first})")
    except Exception as e:  # noqa: BLE001
        failures += 1
        print(f"FAIL {label}: {e}")


check("cargo on PATH", ["cargo", "--version"])
check("rustc on PATH", ["rustc", "--version"])
check("ffmpeg on PATH", ["ffmpeg", "-version"])
print("info  GPU adapter is probed at render time (renderer prints name + backend)")

if failures:
    print(f"\n{failures} hard failure(s) — install Rust via https://rustup.rs first.")
    sys.exit(1)
print("\npreflight clean.")
