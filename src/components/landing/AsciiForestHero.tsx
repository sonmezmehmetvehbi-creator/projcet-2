'use client'

import { useEffect, useRef } from 'react'

// Density-ordered charset: space (darkest / emptiest) → '@' (brightest / densest).
const CHARSET = ' .:-=+*#%@'
// Accent endpoints. Bright luminance cells trend toward AceForge green; dark
// cells dim toward a near-black green so the art never competes with the
// foreground copy.
const BRIGHT = { r: 74, g: 222, b: 128 } // rgb(74,222,128)
const DARK = { r: 20, g: 40, b: 20 } // rgb(20,40,20)

/**
 * Full-bleed character-art rendering of a source photo, drawn on a Canvas2D and
 * tinted with AceForge's green accent. Performance-tuned: luminance/char/colour
 * per cell are computed once per layout, and the animation only applies a subtle
 * per-cell sine shimmer (throttled to ~30fps). Honors prefers-reduced-motion
 * (static single frame) and pauses via the Page Visibility API.
 */
export default function AsciiForestHero() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    // Per-cell precomputed state (rebuilt on resize / image load).
    let cols = 0
    let rows = 0
    let cellSize = 13
    let charIdx = new Uint8Array(0) // index into CHARSET per cell
    let colR = new Uint8Array(0)
    let colG = new Uint8Array(0)
    let colB = new Uint8Array(0)
    let ready = false

    let rafId = 0
    let running = false
    let lastFrame = 0

    let disposed = false
    let sizeRetries = 0
    let retryRafId = 0

    const img = new Image()
    let imgLoaded = false

    // Offscreen canvas used to downsample the photo to one pixel per grid cell.
    const sampler = document.createElement('canvas')
    const sctx = sampler.getContext('2d', { willReadFrequently: true })

    function buildGrid() {
      if (disposed) return
      if (!sctx) return
      if (!imgLoaded) return
      const w = wrap!.clientWidth
      const h = wrap!.clientHeight
      if (w === 0 || h === 0) {
        // The wrapper hasn't been laid out yet (its parent hero section reports
        // no height at this instant). Retry on the next frame — bounded — so the
        // effect self-heals once real layout occurs, instead of bailing forever.
        if (sizeRetries < 120) {
          sizeRetries++
          retryRafId = requestAnimationFrame(() => {
            buildGrid()
            if (prefersReducedMotion) render(0)
          })
        }
        return
      }
      console.log('[AsciiForestHero] CURRENT WIDTH CHECK:', w, 'x', h)
      sizeRetries = 0

      cellSize = window.innerWidth < 768 ? 18 : 13
      cols = Math.max(1, Math.ceil(w / cellSize))
      rows = Math.max(1, Math.ceil(h / cellSize))

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = Math.round(w * dpr)
      canvas!.height = Math.round(h * dpr)
      canvas!.style.width = w + 'px'
      canvas!.style.height = h + 'px'
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx!.textBaseline = 'top'
      ctx!.font = `${cellSize}px ui-monospace, SFMono-Regular, Menlo, monospace`

      // Draw the photo "cover" into a cols×rows offscreen buffer → each pixel is
      // the average luminance of one cell.
      sampler.width = cols
      sampler.height = rows
      const scale = Math.max(cols / img.width, rows / img.height)
      const dw = img.width * scale
      const dh = img.height * scale
      sctx.clearRect(0, 0, cols, rows)
      sctx.drawImage(img, (cols - dw) / 2, (rows - dh) / 2, dw, dh)

      const data = sctx.getImageData(0, 0, cols, rows).data
      const n = cols * rows
      charIdx = new Uint8Array(n)
      colR = new Uint8Array(n)
      colG = new Uint8Array(n)
      colB = new Uint8Array(n)
      for (let i = 0; i < n; i++) {
        const p = i * 4
        const lum =
          (0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]) / 255
        charIdx[i] = Math.min(
          CHARSET.length - 1,
          Math.floor(lum * (CHARSET.length - 1)),
        )
        colR[i] = Math.round(DARK.r + (BRIGHT.r - DARK.r) * lum)
        colG[i] = Math.round(DARK.g + (BRIGHT.g - DARK.g) * lum)
        colB[i] = Math.round(DARK.b + (BRIGHT.b - DARK.b) * lum)
      }
      ready = true
      // Draw an immediate frame so the art shows even before the first animation
      // tick (and covers the reduced-motion / paused-tab cases).
      render(lastFrame)
    }

    function render(time: number) {
      if (!ready) return
      const w = wrap!.clientWidth
      const h = wrap!.clientHeight
      ctx!.fillStyle = '#070809'
      ctx!.fillRect(0, 0, w, h)

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x
          const ci = charIdx[i]
          if (ci === 0) continue // space → nothing to draw
          // Subtle per-cell shimmer via a position-offset sine wave.
          const shimmer = prefersReducedMotion
            ? 1
            : 0.82 + 0.18 * Math.sin(time * 0.0018 + (x + y) * 0.6)
          const r = Math.min(255, (colR[i] * shimmer) | 0)
          const g = Math.min(255, (colG[i] * shimmer) | 0)
          const b = Math.min(255, (colB[i] * shimmer) | 0)
          ctx!.fillStyle = `rgb(${r},${g},${b})`
          ctx!.fillText(CHARSET[ci], x * cellSize, y * cellSize)
        }
      }
    }

    function loop(time: number) {
      if (!running) return
      // Throttle to ~30fps — the shimmer is subtle so a lower cadence is plenty
      // and keeps the effect cheap.
      if (time - lastFrame >= 33) {
        lastFrame = time
        render(time)
      }
      rafId = requestAnimationFrame(loop)
    }

    function start() {
      if (running || prefersReducedMotion) return
      running = true
      rafId = requestAnimationFrame(loop)
    }

    function stop() {
      running = false
      if (rafId) cancelAnimationFrame(rafId)
    }

    function onVisibility() {
      if (document.hidden) stop()
      else start()
    }

    img.onload = () => {
      imgLoaded = true
      buildGrid()
      if (prefersReducedMotion) render(0)
      else start()
    }
    img.src = '/landing/hero-nature.jpg'

    const ro = new ResizeObserver(() => {
      buildGrid()
      if (prefersReducedMotion) render(0)
    })
    ro.observe(wrap)

    // Safety net: if the image's onload fired before the wrapper had its final
    // layout (e.g. a cached image on first paint), buildGrid would have bailed on
    // a zero size. Re-run it on the next frame, once layout has settled.
    const mountRaf = requestAnimationFrame(() => {
      buildGrid()
      if (prefersReducedMotion) render(0)
    })

    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      disposed = true
      stop()
      if (retryRafId) cancelAnimationFrame(retryRafId)
      cancelAnimationFrame(mountRaf)
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      img.onload = null
    }
  }, [])

  return (
    <div ref={wrapRef} className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
      {/* Readability scrim: darkens edges + base so foreground copy stays legible
          over whatever the character-art is rendering underneath. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 40%, rgba(7,8,9,0.15) 0%, rgba(7,8,9,0.55) 55%, rgba(7,8,9,0.85) 100%), linear-gradient(to top, rgba(8,9,12,0.85) 0%, rgba(8,9,12,0.35) 45%, rgba(8,9,12,0.45) 100%)',
        }}
      />
    </div>
  )
}
