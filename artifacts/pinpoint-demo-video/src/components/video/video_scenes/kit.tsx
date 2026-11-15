// Shared film kit: timing, motion tokens and the few primitives every shot uses.

import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type Transition,
} from 'framer-motion';
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { useSceneTimer } from '@/lib/video';

import { STILL } from '../devStill';

export const asset = (path: string): string =>
  `${import.meta.env.BASE_URL}${path}`;

export const v = (n: number): string => `${n}vmin`;

// Motion tokens
export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_IO: [number, number, number, number] = [0.65, 0, 0.35, 1];
export const EASE_IN: [number, number, number, number] = [0.6, 0, 0.9, 0.3];
export const SNAP: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.9,
};
export const POP: Transition = {
  type: 'spring',
  stiffness: 520,
  damping: 24,
  mass: 0.8,
};
export const SLAM: Transition = {
  type: 'spring',
  stiffness: 700,
  damping: 32,
  mass: 0.9,
};
export const SOFT: Transition = { type: 'spring', stiffness: 110, damping: 19 };

/**
 * Counts the cues (ms from shot start) that have passed. Every shot is a pure
 * function of this number, driven by the scaffold's scene timer so preview
 * pause freezes it.
 */
export function useBeats(cues: readonly number[]): number {
  const [beat, setBeat] = useState(() =>
    STILL ? (STILL.beat ?? cues.length) : 0,
  );
  const schedule = cues.join('|');
  const events = useMemo(
    () =>
      STILL
        ? []
        : schedule
            .split('|')
            .filter(Boolean)
            .map((time, index) => ({
              time: Number(time),
              callback: () => setBeat((current) => Math.max(current, index + 1)),
            })),
    [schedule],
  );
  useSceneTimer(events);
  return beat;
}

/** Types `text` on, one character per timer event, starting at `startMs`. */
export function useTyped(
  text: string,
  startMs: number,
  perCharMs: number,
  shownInStill: boolean,
): string {
  const [count, setCount] = useState(() =>
    STILL ? (shownInStill ? text.length : 0) : 0,
  );
  const events = useMemo(
    () =>
      STILL
        ? []
        : Array.from({ length: text.length }, (_, index) => ({
            time: startMs + index * perCharMs,
            callback: () => setCount((current) => Math.max(current, index + 1)),
          })),
    [text, startMs, perCharMs],
  );
  useSceneTimer(events);
  return text.slice(0, count);
}

function formatNumber(value: number, decimals: number): string {
  return value.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

interface CountProps {
  to: number;
  from?: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

/** A numeral that tweens to `to` whenever it changes. */
export function Count({
  to,
  from = 0,
  duration = 0.7,
  delay = 0,
  decimals = 0,
  prefix = '',
  suffix = '',
}: CountProps) {
  const value = useMotionValue(from);
  const text = useTransform(
    value,
    (current) => `${prefix}${formatNumber(current, decimals)}${suffix}`,
  );

  useEffect(() => {
    const controls = animate(value, to, { duration, delay, ease: EASE });
    return () => controls.stop();
  }, [value, to, duration, delay]);

  return <motion.span>{text}</motion.span>;
}

interface MaskLineProps {
  show: boolean;
  delay?: number;
  duration?: number;
  children: ReactNode;
  style?: CSSProperties;
}

/** One line of type rising out of its own mask. */
export function MaskLine({
  show,
  delay = 0,
  duration = 0.6,
  children,
  style,
}: MaskLineProps) {
  return (
    <span
      style={{
        display: 'block',
        overflow: 'hidden',
        padding: '0.06em 0.04em 0.18em',
        margin: '-0.06em -0.04em -0.18em',
        ...style,
      }}
    >
      <motion.span
        style={{ display: 'block', willChange: 'transform' }}
        initial={{ y: '118%' }}
        animate={{ y: show ? '0%' : '118%' }}
        transition={{ duration, delay: show ? delay : 0, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}

interface RiseProps {
  show: boolean;
  delay?: number;
  x?: number;
  y?: number;
  scale?: number;
  duration?: number;
  spring?: Transition;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** Fade and travel in from an offset given in vmin. */
export function Rise({
  show,
  delay = 0,
  x = 0,
  y = 2.4,
  scale = 1,
  duration = 0.5,
  spring,
  children,
  className,
  style,
}: RiseProps) {
  const hidden = { opacity: 0, x: `${x}vmin`, y: `${y}vmin`, scale };
  const shown = { opacity: 1, x: '0vmin', y: '0vmin', scale: 1 };
  const base: Transition = spring ?? { duration, ease: EASE };
  return (
    <motion.div
      className={className}
      style={style}
      initial={hidden}
      animate={show ? shown : hidden}
      transition={{
        ...base,
        delay: show ? delay : 0,
        opacity: { duration: 0.3, delay: show ? delay : 0 },
      }}
    >
      {children}
    </motion.div>
  );
}

interface StrikeProps {
  show: boolean;
  delay?: number;
  color?: string;
  thickness?: string;
  top?: string;
  bleed?: string;
}

/** A strike-through line that draws left to right over its positioned parent. */
export function Strike({
  show,
  delay = 0,
  color = 'var(--pp-acc)',
  thickness = '0.28vmin',
  top = '54%',
  bleed = '0.4vmin',
}: StrikeProps) {
  return (
    <motion.span
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: `-${bleed}`,
        right: `-${bleed}`,
        top,
        height: thickness,
        background: color,
        borderRadius: 999,
        transformOrigin: 'left center',
        pointerEvents: 'none',
      }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: show ? 1 : 0 }}
      transition={{ duration: 0.38, delay: show ? delay : 0, ease: EASE }}
    />
  );
}

/** The official Pinpoint compact mark, as supplied. Never redrawn. */
export function Mark({ size, style }: { size: string; style?: CSSProperties }) {
  return (
    <img
      src={asset('brand/pinpoint-mark.png')}
      alt=""
      draggable={false}
      style={{
        width: size,
        height: size,
        borderRadius: `calc(${size} * 0.2)`,
        display: 'block',
        flex: '0 0 auto',
        ...style,
      }}
    />
  );
}

const CHAPTER_COUNT = 9;

interface ChapterStripProps {
  tone: 'light' | 'dark';
  /** The posting's own words for this use case. */
  ask: string;
  badge: string;
  screen: string;
  /** 1-based chapter position, 1..9. */
  step: number;
  intro?: boolean;
}

/**
 * The slate every chapter carries: the posting's words on the left, the Desk
 * OS screen that answers them on the right, and the concept label.
 */
export function ChapterStrip({
  tone,
  ask,
  badge,
  screen,
  step,
  intro = false,
}: ChapterStripProps) {
  const dark = tone === 'dark';
  const fg = dark ? '#FBF3F3' : 'var(--pp-ink)';
  const dim = dark ? 'rgba(247,217,219,0.82)' : 'var(--pp-muted)';
  const acc = dark ? 'var(--pp-rose)' : 'var(--pp-acc)';
  const rule = dark ? 'rgba(241,184,187,0.26)' : 'rgba(66,0,8,0.14)';

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: v(6),
        right: v(6),
        top: v(5),
        height: v(6.4),
        display: 'flex',
        alignItems: 'center',
        gap: v(2),
        zIndex: 40,
        color: fg,
      }}
      initial={intro ? { opacity: 0, y: '-2vmin' } : false}
      animate={{ opacity: 1, y: '0vmin' }}
      transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
    >
      <Mark size={v(5.2)} />
      <div style={{ flex: '0 0 auto' }}>
        <div className="f-eyebrow" style={{ fontSize: v(1.9), color: dim }}>
          From the posting
        </div>
        <div
          style={{
            fontSize: v(3),
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            marginTop: v(0.4),
            whiteSpace: 'nowrap',
          }}
        >
          “{ask}”
        </div>
      </div>
      <div
        style={{
          flex: 1,
          alignSelf: 'flex-end',
          marginBottom: v(1.75),
          height: v(0.24),
          minHeight: 1,
          background: rule,
          position: 'relative',
          borderRadius: 999,
        }}
      >
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            background: acc,
            transformOrigin: 'left center',
            borderRadius: 999,
          }}
          initial={{ scaleX: (step - 1) / CHAPTER_COUNT }}
          animate={{ scaleX: step / CHAPTER_COUNT }}
          transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
        />
      </div>
      <div style={{ flex: '0 0 auto', textAlign: 'right' }}>
        <div className="f-eyebrow" style={{ fontSize: v(1.9), color: dim }}>
          Desk OS · concept · synthetic data
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: v(1.1),
            marginTop: v(0.4),
          }}
        >
          <span
            style={{
              minWidth: v(3.3),
              height: v(3.3),
              padding: `0 ${v(0.6)}`,
              boxSizing: 'border-box',
              borderRadius: v(0.8),
              background: dark ? 'rgba(241,184,187,0.22)' : 'var(--pp-deep)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontSize: v(1.9),
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {badge}
          </span>
          <span
            style={{
              fontSize: v(3),
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              whiteSpace: 'nowrap',
            }}
          >
            {screen}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
