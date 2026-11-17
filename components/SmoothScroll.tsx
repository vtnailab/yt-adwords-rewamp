'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/** Site-wide Lenis smooth scrolling. Skipped for visitors who prefer reduced motion. */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({
      lerp: 0.1,
      autoRaf: true,
      anchors: true, // smooth-scroll in-page #links
      // Let scrollable overlays (e.g. the mobile menu) scroll natively.
      prevent: node => node.classList.contains('clone-mobile-menu'),
    });
    // Pause smooth scrolling while the cart drawer or phone menu locks the page.
    const root = document.documentElement;
    const sync = () => (root.classList.contains('yaw-locked') ? lenis.stop() : lenis.start());
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => { observer.disconnect(); lenis.destroy(); };
  }, []);
  return null;
}
