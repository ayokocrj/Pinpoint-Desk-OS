// Shot 03 / 10.0–17.5 s — "follow-up suggestions" → 0 · Morning brief.

import { AnimatePresence, motion } from 'framer-motion';

import {
  ChapterStrip,
  Count,
  EASE,
  EASE_IN,
  MaskLine,
  POP,
  Rise,
  SNAP,
  useBeats,
  v,
} from './kit';

// 1 mandate card · 2 tiles count · 3 headline 2–3 · 4 table rows ·
// 5 ring: why today · 6 ring: evidence, dated · 7 ring: your call · 8 hand-off
const CUES = [300, 625, 1250, 1875, 3125, 4375, 5625, 6875] as const;

const TILES = [
  {
    n: 9,
    of: 'of 55',
    label: 'follow-ups for today, of those due this month',
    color: 'var(--pp-ink)',
  },
  {
    n: 3,
    of: '',
    label: 'mandates wait for your decision on a longlist',
    color: 'var(--pp-warn)',
  },
  {
    n: 26,
    of: '',
    label: 'records on your lists not checked in 24 months',
    color: 'var(--pp-warn)',
  },
  {
    n: 3,
    of: '',
    label: 'duplicate pairs on your lists to review',
    color: 'var(--pp-warn)',
  },
  {
    n: 0,
    of: '',
    label: 'emails, CVs or messages sent by the system',
    color: 'var(--pp-ok)',
  },
];

const ROWS = [
  {
    code: 'C-1746',
    tag: 'on a longlist',
    why: 'Said open to a move; last spoken to 7 months ago',
    evidence: 'Your note of 22 Apr 2026',
  },
  {
    code: 'C-1803',
    tag: 'on a longlist',
    why: 'Said open to a move; last spoken to 9 months ago',
    evidence: 'Your note of 9 Feb 2026',
  },
  {
    code: 'C-0166',
    tag: '',
    why: 'Moved firm on 14 Oct 2026: the record still shows the previous firm',
    evidence: 'Public register entry (simulated), checked this week',
  },
  {
    code: 'C-0617',
    tag: '',
    why: 'Moved firm on 23 Sep 2026: the record still shows the previous firm',
    evidence: 'Public register entry (simulated), checked this week',
  },
];

const CALLOUTS = [
  {
    label: 'Why today',
    text: 'Said open to a move; last spoken to 7 months ago.',
  },
  { label: 'Evidence, dated', text: 'Your note of 22 Apr 2026.' },
  { label: 'Your call', text: 'A draft is held for you. Nothing is sent.' },
];

const GRID = `${v(22)} ${v(37)} ${v(26)} 1fr`;

function Ring({ on }: { on: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: v(-1),
        right: v(-0.6),
        top: v(-0.9),
        bottom: v(-0.9),
        border: `${v(0.34)} solid var(--pp-acc)`,
        borderRadius: v(1.1),
        pointerEvents: 'none',
      }}
      initial={{ opacity: 0, scale: 1.08 }}
      animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 1.08 }}
      transition={{ duration: 0.3, ease: EASE }}
    />
  );
}

export function BriefScene() {
  const beat = useBeats(CUES);
  const out = beat >= 8;
  const callout = beat >= 7 ? 2 : beat >= 6 ? 1 : beat >= 5 ? 0 : -1;

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: 'var(--pp-rail)',
        color: 'var(--pp-ink)',
        zIndex: 10,
      }}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ y: '-3vmin', transition: { duration: 0.6, ease: 'easeIn' } }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <ChapterStrip
        tone="light"
        ask="follow-up suggestions"
        badge="0"
        screen="Morning brief"
        step={1}
        intro
      />

      {/* Type column */}
      <motion.div
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: v(62) }}
        initial={{ y: '0vmin', opacity: 1 }}
        animate={{ y: out ? '-3vmin' : '0vmin', opacity: out ? 0.25 : 1 }}
        transition={{ duration: 0.55, ease: EASE_IN }}
      >
        <div
          className="f-eyebrow"
          style={{
            position: 'absolute',
            left: v(6),
            top: v(16.2),
            color: 'var(--pp-acc)',
          }}
        >
          Tuesday 1 December 2026 · 08:12
        </div>
        <div
          className="f-h"
          style={{
            position: 'absolute',
            left: v(5.7),
            top: v(21),
            fontSize: v(8.2),
            whiteSpace: 'nowrap',
          }}
        >
          <MaskLine show delay={0.1}>
            Nine calls
          </MaskLine>
          <MaskLine show={beat >= 3}>worth making</MaskLine>
          <MaskLine show={beat >= 3} delay={0.2}>
            today.
          </MaskLine>
        </div>

        <div
          style={{ position: 'absolute', left: v(6), top: v(53), width: v(54) }}
        >
          <AnimatePresence mode="wait">
            {callout >= 0 && (
              <motion.div
                key={callout}
                style={{
                  borderLeft: `${v(0.5)} solid var(--pp-acc)`,
                  paddingLeft: v(2.4),
                }}
                initial={{ opacity: 0, y: '1.8vmin' }}
                animate={{ opacity: 1, y: '0vmin' }}
                exit={{
                  opacity: 0,
                  y: '-1.2vmin',
                  transition: { duration: 0.14 },
                }}
                transition={{ duration: 0.36, ease: EASE }}
              >
                <div className="f-eyebrow" style={{ color: 'var(--pp-acc)' }}>
                  {CALLOUTS[callout].label}
                </div>
                <div
                  className="f-sub"
                  style={{ fontSize: v(3.4), marginTop: v(1.1) }}
                >
                  {CALLOUTS[callout].text}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Rise
          show={beat >= 7}
          delay={0.25}
          y={1.4}
          style={{
            position: 'absolute',
            left: v(6),
            top: v(84),
            fontSize: v(2.3),
            fontWeight: 600,
            color: 'var(--pp-ok)',
            whiteSpace: 'nowrap',
          }}
        >
          0 emails, CVs or messages sent by the system.
        </Rise>
      </motion.div>

      {/* Workspace, macro scale */}
      <motion.div
        className="pp-ui"
        style={{
          position: 'absolute',
          left: v(66),
          top: v(15),
          width: v(106),
          display: 'flex',
          flexDirection: 'column',
          gap: v(1.6),
        }}
        initial={{ y: '0vmin' }}
        animate={{ y: out ? '1.6vmin' : '0vmin' }}
        transition={{ duration: 0.55, ease: EASE_IN }}
      >
        <Rise show={beat >= 1} y={2} spring={SNAP}>
          <motion.div
            className="pp-card"
            style={{ padding: `${v(1.8)} ${v(2.2)}`, position: 'relative' }}
            initial={{ scale: 1 }}
            animate={{ scale: out ? 1.025 : 1 }}
            transition={POP}
          >
            <motion.span
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: v(-0.3),
                border: `${v(0.4)} solid var(--pp-acc)`,
                borderRadius: v(2.2),
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: out ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            />
            <div
              style={{ display: 'flex', alignItems: 'center', gap: v(1.2) }}
            >
              <span
                style={{
                  fontSize: v(2.3),
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                08:12 · a mandate arrived
              </span>
              <span className="pp-pill deep" style={{ fontSize: v(1.6) }}>
                M-0457
              </span>
              <span style={{ flex: 1 }} />
              <span
                style={{
                  fontSize: v(1.6),
                  color: 'var(--pp-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                one email, one PDF, your note: “Longlist today”
              </span>
            </div>
            <div
              style={{ fontSize: v(1.78), lineHeight: 1.5, marginTop: v(0.8) }}
            >
              Associate, Corporate M&A, 3 to 5 years since admission, London,
              for US firm 07 (synthetic). The longlist is ready: 5,000 records
              read, 207 people fit, <b>ten proposed</b>.
            </div>
          </motion.div>
        </Rise>

        <div style={{ display: 'flex', gap: v(1.2) }}>
          {TILES.map((tile, index) => {
            const zero = index === 4;
            return (
              <motion.div
                key={tile.label}
                className="pp-tile"
                style={{ flex: 1, minWidth: 0, height: v(13) }}
                initial={{ opacity: 0, y: '2.4vmin', scale: 0.94 }}
                animate={
                  beat >= 2
                    ? {
                        opacity: 1,
                        y: '0vmin',
                        scale: zero && beat >= 7 ? [1, 1.07, 1] : 1,
                      }
                    : { opacity: 0, y: '2.4vmin', scale: 0.94 }
                }
                transition={
                  zero && beat >= 7
                    ? { duration: 0.5, ease: 'easeInOut' }
                    : { ...POP, delay: index * 0.1 }
                }
              >
                <div className="pp-tile-n" style={{ color: tile.color }}>
                  <Count
                    to={beat >= 2 ? tile.n : 0}
                    duration={0.6}
                    delay={index * 0.1}
                  />
                  {tile.of && <small>{tile.of}</small>}
                </div>
                <div className="pp-tile-l">{tile.label}</div>
              </motion.div>
            );
          })}
        </div>

        <Rise show={beat >= 4} y={1.6}>
          <div
            style={{ fontSize: v(1.95), fontWeight: 600, marginBottom: v(1) }}
          >
            Who to call today, and why
          </div>
          <div
            className="pp-card"
            style={{ padding: `${v(1.2)} ${v(2)}`, overflow: 'visible' }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: GRID,
                alignItems: 'center',
                height: v(3.8),
                margin: `0 ${v(-0.8)}`,
                padding: `0 ${v(0.8)}`,
                background: 'var(--pp-soft)',
                borderRadius: v(0.6),
                fontSize: v(1.55),
                color: 'var(--pp-muted)',
              }}
            >
              <span>Record</span>
              <span>Why today</span>
              <span>Evidence, dated</span>
              <span>Your call</span>
            </div>
            {ROWS.map((row, index) => (
              <motion.div
                key={row.code}
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID,
                  alignItems: 'center',
                  columnGap: 0,
                  minHeight: index < 2 ? v(5.6) : v(7.6),
                  borderTop:
                    index === 0 ? 'none' : '1px solid var(--pp-line)',
                  fontSize: v(1.82),
                  lineHeight: 1.38,
                }}
                initial={{ opacity: 0, x: '3vmin' }}
                animate={
                  beat >= 4
                    ? { opacity: 1, x: '0vmin' }
                    : { opacity: 0, x: '3vmin' }
                }
                transition={{
                  duration: 0.45,
                  delay: 0.12 + index * 0.3,
                  ease: EASE,
                }}
              >
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: v(1) }}
                >
                  <span className="pp-code">{row.code}</span>
                  {row.tag && <span className="pp-pill blue">{row.tag}</span>}
                </span>
                <span style={{ position: 'relative', paddingRight: v(2.4) }}>
                  {row.why}
                  {index === 0 && <Ring on={callout === 0} />}
                </span>
                <span style={{ position: 'relative', paddingRight: v(2.4) }}>
                  {row.evidence}
                  {index === 0 && <Ring on={callout === 1} />}
                </span>
                <span
                  style={{
                    position: 'relative',
                    color: 'var(--pp-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  draft held · open
                  {index === 0 && <Ring on={callout === 2} />}
                </span>
              </motion.div>
            ))}
          </div>
        </Rise>
      </motion.div>
    </motion.div>
  );
}
