# GIF generation

Convert MP4 to an optimized GIF at 15fps, 1280px wide, using two explicit ffmpeg passes
followed by lossy gifsicle compression.

The single-command `split` filter approach hits memory limits on longer videos, so the
palette generation is done as a separate pass.

```bash
# Pass 1: generate palette
ffmpeg -y -i input.mp4 \
  -vf "fps=15,scale=1280:-1:flags=lanczos,palettegen=stats_mode=diff" \
  -update 1 palette.png

# Pass 2: encode GIF using the palette
ffmpeg -y -i input.mp4 -i palette.png \
  -filter_complex "fps=15,scale=1280:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" \
  -loop 0 output-twpass.gif

# Lossy optimization
gifsicle --optimize=3 --lossy=80 output-twpass.gif -o output-opt.gif
```

For the files in this directory:

```bash
# compile.mp4 (10s) -> compile-opt.gif (1.6MB)
ffmpeg -y -i compile.mp4 -vf "fps=15,scale=1280:-1:flags=lanczos,palettegen=stats_mode=diff" -update 1 palette.png
ffmpeg -y -i compile.mp4 -i palette.png -filter_complex "fps=15,scale=1280:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" -loop 0 compile-twpass.gif
gifsicle --optimize=3 --lossy=80 compile-twpass.gif -o compile-opt.gif

# compile-all.mp4 (100s) -> compile-all-opt.gif (6.3MB)
ffmpeg -y -i compile-all.mp4 -vf "fps=15,scale=1280:-1:flags=lanczos,palettegen=stats_mode=diff" -update 1 palette-all.png
ffmpeg -y -i compile-all.mp4 -i palette-all.png -filter_complex "fps=15,scale=1280:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" -loop 0 compile-all-twpass.gif
gifsicle --optimize=3 --lossy=80 compile-all-twpass.gif -o compile-all-opt.gif
```
