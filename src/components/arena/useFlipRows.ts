'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'

// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsoLayout = typeof document !== 'undefined' ? useLayoutEffect : useEffect

// FLIP (First-Last-Invert-Play) row reordering. Attach the returned setter as a
// `ref` on each row's OUTER wrapper (the element that should slide). When the
// ordered id list changes while `active`, each row that moved is snapped to its
// previous vertical position and then transitioned to its new one, so the eye
// can track cards sliding past each other. offsetTop is used (not
// getBoundingClientRect) so an ancestor's transform/scale can't corrupt the
// measurement.
export function useFlipRows(orderedIds: string[], active: boolean) {
  const refs = useRef<Record<string, HTMLElement | null>>({})
  const setters = useRef<Record<string, (el: HTMLElement | null) => void>>({})
  const lastPos = useRef<Record<string, number>>({})

  const setRef = (id: string) => (setters.current[id] ??= (el) => { refs.current[id] = el })

  useIsoLayout(() => {
    if (!active) return
    const newPos: Record<string, number> = {}
    orderedIds.forEach((id) => { const el = refs.current[id]; if (el) newPos[id] = el.offsetTop })
    orderedIds.forEach((id, i) => {
      const el = refs.current[id]
      if (!el) return
      const oldTop = lastPos.current[id]
      const nt = newPos[id]
      if (oldTop == null || nt == null) return
      const delta = oldTop - nt
      if (Math.abs(delta) < 1) return
      // Invert: place the row where it used to be, with no transition…
      el.style.transition = 'none'
      el.style.transform = `translateY(${delta}px)`
      // …then, next frame, play it to its new spot (staggered per row).
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transition = 'transform 0.7s cubic-bezier(0.22,1,0.36,1)'
        el.style.transitionDelay = `${Math.min(i, 8) * 0.05}s`
        el.style.transform = 'translateY(0)'
      }))
    })
    lastPos.current = newPos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, orderedIds.join('|')])

  return setRef
}
