# EWAM project page

A dependency-free static project page for:

> EWAM: Emergent Depth-Wise Specialization in a Unified Embodied Model

## Preview

Serve the directory locally:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Deploy

The site is ready for GitHub Pages. Put the directory at the root of a repository
and enable **Settings → Pages → Deploy from a branch**.

## Add videos

1. Copy MP4 files into `assets/videos/`.
2. In `index.html`, find a `.demo-card`.
3. Set its `data-video-src`, for example:

```html
<button
  class="demo-card"
  data-video-src="assets/videos/adjust-bottle.mp4"
  data-title="Adjust Bottle">
```

The existing modal will automatically play the file. Empty values render the
current “Video coming soon” placeholder.

Recommended export:

- MP4 / H.264
- 1920×1080 or 1280×720
- web-optimized / fast-start enabled
- under 25 MB per clip where possible

## Files

- `index.html`: page content
- `styles.css`: responsive visual system
- `script.js`: navigation, figure lightbox, video modal, citation copy
- `assets/EWAM_Technical_Report.pdf`: downloadable paper
- `assets/images/`: website figures
- `assets/videos/`: demonstration clips
