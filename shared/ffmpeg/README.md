# shared/ffmpeg — render backend (not a skill)

Every video-producing skill in this repo encodes its final deliverable with ffmpeg.
This folder holds shared encode guidance so each skill doesn't reinvent it.

## Requirement

ffmpeg on `PATH`. Verify with:

```bash
ffmpeg -version
```

Windows: `winget install Gyan.FFmpeg` — macOS: `brew install ffmpeg` — Linux: distro package.

## Standard encode (image frames -> 1080p60 MP4)

```bash
ffmpeg -y -framerate 60 -i frame_%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 final.mp4
```

## Extract a review frame (visual frame review)

```bash
ffmpeg -y -ss <seconds> -i final.mp4 -frames:v 1 review_<t>.png
```

Skills: prefer these shapes before inventing custom flags. Skill-specific needs (e.g. concatenation, audio muxing) live in the skill's own docs.
