#!/usr/bin/env python3
"""Concatenate rendered Manim scene clips into one final.mp4.

Usage:
  uv run --with av python stitch.py -o final.mp4 clip1.mp4 clip2.mp4 [...]

Strategy:
  1. If ffmpeg is on PATH, use the concat demuxer with stream copy (fast).
  2. Otherwise, or if that fails, re-encode sequentially with pyav (`av`),
     which uv provisions automatically via --with av.

All input clips MUST share resolution; quality/fps may differ only in the
pyav path (it re-encodes). Exit 0 on success.
"""

import argparse
import os
import shutil
import subprocess
import sys
import tempfile


def ffmpeg_concat(clips, out_path):
    if not shutil.which("ffmpeg"):
        return False, "ffmpeg not found"
    list_path = ""
    try:
        fd, list_path = tempfile.mkstemp(suffix=".txt", dir=os.path.dirname(out_path) or ".")
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            for c in clips:
                abs_path = os.path.abspath(c).replace("\\", "/")
                fh.write(f"file '{abs_path}'\n")
        cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_path,
               "-c", "copy", "-movflags", "+faststart", out_path]
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        if p.returncode == 0 and os.path.isfile(out_path) and os.path.getsize(out_path) > 0:
            return True, "ffmpeg stream copy"
        return False, f"ffmpeg failed: {(p.stderr or '').strip().splitlines()[-1:]}"
    finally:
        if list_path and os.path.exists(list_path):
            os.remove(list_path)


def av_concat(clips, out_path):
    import fractions
    import av

    probe = av.open(clips[0])
    stream = probe.streams.video[0]
    width, height = stream.codec_context.width, stream.codec_context.height
    fps = float(stream.average_rate or 30)
    probe.close()

    container = av.open(out_path, "w",
                        options={"movflags": "+faststart"})
    enc = container.add_stream("libx264", rate=fps)
    enc.width, enc.height = width, height
    enc.pix_fmt = "yuv420p"
    enc.time_base = fractions.Fraction(1, int(round(fps)))
    enc.options = {"crf": "18", "preset": "medium"}

    total = 0
    try:
        for clip in clips:
            src = av.open(clip)
            for frame in src.decode(video=0):
                if (frame.width, frame.height) != (width, height):
                    raise SystemExit(
                        f"DIMENSION MISMATCH: {clip} is {frame.width}x{frame.height}, "
                        f"expected {width}x{height}. Re-render all clips at the same quality."
                    )
                for packet in enc.encode(frame.reformat(format="yuv420p")):
                    container.mux(packet)
                total += 1
                if total % 300 == 0:
                    print(f"      ...{total} frames")
            src.close()
        for packet in enc.encode():
            container.mux(packet)
    finally:
        container.close()
    return True, f"pyav re-encode ({total} frames @ ~{fps:g}fps)"


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("-o", "--output", required=True, help="output mp4 path")
    ap.add_argument("clips", nargs="+", help="input mp4 files in play order")
    args = ap.parse_args()

    missing = [c for c in args.clips if not os.path.isfile(c)]
    if missing:
        sys.exit(f"ERROR: missing input clip(s): {missing}")
    os.makedirs(os.path.dirname(os.path.abspath(args.output)) or ".", exist_ok=True)

    ok, how = ffmpeg_concat(args.clips, args.output)
    method = "ffmpeg"
    if not ok:
        print(f"[info] {how}; falling back to pyav...")
        ok, how = av_concat(args.clips, args.output)
        method = "pyav"
    if not ok:
        sys.exit(f"ERROR: stitching failed: {how}")

    size_mb = os.path.getsize(args.output) / 1e6
    print(f"DONE [{method}] -> {os.path.abspath(args.output)} "
          f"({len(args.clips)} clip(s), {size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
