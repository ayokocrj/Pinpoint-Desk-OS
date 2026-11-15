// Shot 01 / 0.0–5.0 s — the posting's own words, struck through.

import { motion } from 'framer-motion';

import {
  asset,
  EASE,
  EASE_IN,
  EASE_IO,
  MaskLine,
  Rise,
  useBeats,
  v,
} from './kit';

// ms from shot start, on the bed's dry intro hits.
// 1 quote lead · 2 rule · 3–5 the three leaks · 6 answer + strikes ·
// 7 underline + attribution · 8 pin-dot and hand-off
const CUES = [300, 850, 1250, 1875, 2500, 3125, 3750, 4375] as const;

const LEAKS = ['data entry,', 'duplicate records', 'and scattered emails.”'];

export function HookScene() {
  const beat = useBeats(CUES);
  const out = beat >= 8;

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{ background: 'var(--pp-deep)', color: '#FBF3F3', zIndex: 10 }}
      initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      exit={{ scale: 1.03, transition: { duration: 0.7, ease: 'linear' } }}
      transition={{ duration: 0.45, ease: EASE_IO }}
    >
      <div
        className="f-eyebrow"
        style={{
          position: 'absolute',
          left: v(6),
          top: v(6.6),
          color: 'var(--pp-rose)',
        }}
      >
        The posting · Chief AI Tech Officer
      </div>
      <img
        src={asset('brand/pinpoint-logo.png')}
        alt="Pinpoint Partners"
        draggable={false}
        style={{
          position: 'absolute',
          right: v(6),
          top: v(5),
          height: v(5.4),
          width: 'auto',
        }}
      />

      <div
        className="f-sub"
        style={{
          position: 'absolute',
          left: v(6),
          top: v(15.4),
          fontSize: v(3.4),
          color: 'var(--pp-rose-soft)',
          whiteSpace: 'nowrap',
        }}
      >
        <MaskLine show={beat >= 1}>
          “…our recruiters lose hours every week to
        </MaskLine>
      </div>

      <motion.div
        style={{
          position: 'absolute',
          left: v(6),
          right: v(6),
          top: v(22.4),
          height: 1,
          background: 'rgba(241,184,187,0.42)',
          transformOrigin: 'left center',
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: beat >= 2 ? 1 : 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      />

      <motion.div
        className="f-h"
        style={{
          position: 'absolute',
          left: v(5.5),
          top: v(25),
          fontSize: v(13.4),
          lineHeight: 0.97,
          whiteSpace: 'nowrap',
        }}
        initial={{ x: '0vmin', opacity: 1 }}
        animate={{ x: out ? '-3vmin' : '0vmin', opacity: out ? 0.2 : 1 }}
        transition={{ duration: 0.6, ease: EASE_IN }}
      >
        {LEAKS.map((line, index) => (
          <div
            key={line}
            style={{ position: 'relative', width: 'fit-content' }}
          >
            <MaskLine show={beat >= 3 + index} duration={0.38}>
              {line}
            </MaskLine>
            <motion.span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: v(-0.4),
                right: v(-0.4),
                top: '56%',
                height: v(1.1),
                background: 'var(--pp-hot)',
                borderRadius: v(0.3),
                transformOrigin: 'left center',
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: beat >= 6 ? 1 : 0 }}
              transition={{ duration: 0.42, delay: index * 0.07, ease: EASE }}
            />
          </div>
        ))}
      </motion.div>

      <div
        className="f-sub"
        style={{
          position: 'absolute',
          left: v(6),
          top: v(68.4),
          fontSize: v(3.4),
          whiteSpace: 'nowrap',
        }}
      >
        <MaskLine show={beat >= 6} delay={0.08}>
          “We think AI can fix that, and we want a brilliant graduate to{' '}
          <span style={{ position: 'relative', fontWeight: 600 }}>
            prove it
            <motion.span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: '-0.14em',
                height: v(0.45),
                background: 'var(--pp-hot)',
                transformOrigin: 'left center',
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: beat >= 7 ? 1 : 0 }}
              transition={{ duration: 0.35, ease: EASE }}
            />
          </span>
          .”
        </MaskLine>
      </div>

      <Rise
        show={beat >= 7}
        y={1.4}
        delay={0.1}
        style={{
          position: 'absolute',
          left: v(6),
          top: v(75.4),
          fontSize: v(2),
          color: 'rgba(247,217,219,0.78)',
          whiteSpace: 'nowrap',
        }}
      >
        Pinpoint Partners · posting on Oxford CareerConnect, November 2026
      </Rise>

      <Rise
        show={out}
        x={3}
        y={0}
        duration={0.35}
        style={{
          position: 'absolute',
          right: `calc(6.2% + ${v(6)})`,
          top: `calc(84% - ${v(2)})`,
          fontSize: v(3.1),
          fontWeight: 600,
          lineHeight: v(4),
          whiteSpace: 'nowrap',
        }}
      >
        Here is the proof of concept
      </Rise>
      <motion.div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '93.8%',
          top: '84%',
          width: v(4.4),
          height: v(4.4),
          marginLeft: v(-2.2),
          marginTop: v(-2.2),
          borderRadius: '50%',
          background: 'var(--pp-hot)',
        }}
        initial={{ scale: 0 }}
        animate={{ scale: out ? [0, 1.3, 1, 2.6] : 0 }}
        transition={
          out
            ? { duration: 0.62, times: [0, 0.26, 0.46, 1], ease: 'easeInOut' }
            : { duration: 0.1 }
        }
      />
    </motion.div>
  );
}
