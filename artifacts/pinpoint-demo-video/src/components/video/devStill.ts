// Development-only still frames.
//
// `?still=<sceneKey>` (optionally `&beat=<n>`) holds one shot at its settled
// frame after cue `n`, with framer-motion animations skipped, so every shot
// can be checked from a single screenshot. It is inert without the query
// parameter and compiled out of production builds (`import.meta.env.DEV`).

import { MotionGlobalConfig } from 'framer-motion';

export interface StillFrame {
  sceneKey: string;
  beat: number | null;
}

function readStill(): StillFrame | null {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const sceneKey = params.get('still');
  if (!sceneKey) return null;
  const rawBeat = params.get('beat');
  const beat = rawBeat === null ? null : Number(rawBeat);
  return { sceneKey, beat: beat !== null && Number.isFinite(beat) ? beat : null };
}

export const STILL: StillFrame | null = readStill();

if (STILL) {
  MotionGlobalConfig.skipAnimations = true;
}
