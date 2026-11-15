// Shot 02 / 5.0–10.0 s — the product, whole: eight screens and an assistant.

import { motion } from 'framer-motion';
import { Fragment, type CSSProperties } from 'react';

import {
  EASE,
  EASE_IN,
  EASE_IO,
  MaskLine,
  Mark,
  POP,
  Rise,
  useBeats,
  v,
} from './kit';

// 1 lockup · 2 headline 1–2 · 3 rail run · 4 headline 3–4 · 5 caption ·
// 6 callout "Outbound sent: 0" · 7 callout "Approval: human only" ·
// 8 honesty line · 9 push-in hand-off
const CUES = [150, 450, 950, 1250, 1900, 2500, 3125, 3750, 4375] as const;
// The rail steps through the eight screens, then returns to the brief.
const RAIL_CUES = [950, 1090, 1230, 1370, 1510, 1650, 1790, 2400] as const;
const RAIL_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 0];

const SCREENS = [
  {
    group: 'Consultant',
    name: 'Morning brief',
    sub: 'Calls for today, with evidence',
    tiles: ['9', '3', '26', '3', '0'],
  },
  {
    group: '',
    name: 'Mandate and longlist',
    sub: 'From the brief to ten names, with the reason for each',
    tiles: ['5,000', '4,800', '629', '207', '10'],
  },
  {
    group: 'Researcher',
    name: 'CV intake',
    sub: 'A CV is data, never an instruction',
    tiles: ['12', '38', '2', '20', '2'],
  },
  {
    group: 'Desk lead',
    name: 'Record hygiene',
    sub: 'One person, one record, a date on every fact',
    tiles: ['5,000', '200', '48%', '22%', '185'],
  },
  {
    group: 'Founder',
    name: 'Test bench',
    sub: 'The method, tested on mandates already closed',
    tiles: ['50', '10', '40', '2.2×'],
  },
  {
    group: '',
    name: 'Delegation map',
    sub: 'What it should not do',
    tiles: ['', '', '', ''],
  },
  {
    group: '',
    name: 'Rules and log',
    sub: 'What Clerk may do, what it cannot, and every step it took',
    tiles: ['', '', ''],
  },
  {
    group: '',
    name: 'The first ninety days',
    sub: 'Three read-outs, the bars, the stop rule',
    tiles: ['', '', ''],
  },
];

const PROMPTS = [
  {
    title: 'Your day',
    lines: ['Who should I call today, and why?', 'Longlist for M-0457?'],
    bad: false,
  },
  {
    title: 'The record',
    lines: ['Who is duplicated on my desk?', 'What can you confirm on CV-05?'],
    bad: false,
  },
  {
    title: 'Across desks',
    lines: ['How many M&A lawyers do we know in New York?'],
    bad: false,
  },
  {
    title: 'What it will not do',
    lines: ['Send C-4112’s CV to the client', 'Merge all the duplicates'],
    bad: true,
  },
];

const BAR_WIDTHS = [72, 58, 80, 46, 64];

const line = '1px solid var(--pp-line)';

function DeskWindow({ active }: { active: number }) {
  const screen = SCREENS[active];
  return (
    <div
      className="pp-ui"
      style={
        {
          '--k': 0.6,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--pp-bg)',
          borderRadius: v(1.6),
          overflow: 'hidden',
          border: '1px solid rgba(66,0,8,0.2)',
          boxShadow:
            '0 5vmin 9vmin -3vmin rgba(66,0,8,0.4), 0 1.2vmin 2.4vmin -1vmin rgba(66,0,8,0.26)',
        } as CSSProperties
      }
    >
      <div className="pp-top">
        <div className="pp-wm">
          <Mark size={v(2.75)} />
          <span>
            pinpoint partners
            <small>FUTURE RECRUITER AI</small>
          </span>
        </div>
        <span
          style={{
            borderLeft: '1px solid rgba(255,255,255,0.28)',
            paddingLeft: v(1.4),
            fontWeight: 600,
            fontSize: v(1.4),
          }}
        >
          Desk OS
        </span>
        <span
          style={{
            border: '1px solid rgba(255,255,255,0.36)',
            borderRadius: 999,
            padding: `${v(0.35)} ${v(0.9)}`,
            fontSize: v(0.9),
            letterSpacing: '0.08em',
            color: 'var(--pp-rose-soft)',
          }}
        >
          CONCEPT · SYNTHETIC DATA
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: v(1.05), color: '#F3E6E7' }}>
          Outbound sent <b style={{ color: 'var(--pp-rose)' }}>0</b>
        </span>
        <span style={{ fontSize: v(1.05), color: '#F3E6E7' }}>
          Approval <b style={{ color: 'var(--pp-rose)' }}>Human only</b>
        </span>
        <span
          style={{
            textAlign: 'right',
            fontSize: v(0.95),
            lineHeight: 1.25,
            color: '#E4C9CB',
          }}
        >
          <b style={{ color: '#fff' }}>London · Legal</b>
          <br />
          Tue 1 Dec 2026 · 08:12
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* Rail */}
        <div
          style={{
            width: v(20.5),
            flex: '0 0 auto',
            background: 'var(--pp-rail)',
            borderRight: line,
            padding: v(1),
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: v(0.35),
          }}
        >
          <div
            style={{
              height: v(3),
              borderRadius: v(0.9),
              border: line,
              background: 'var(--pp-card)',
              display: 'flex',
              alignItems: 'center',
              padding: `0 ${v(1)}`,
              fontSize: v(1.05),
              color: 'var(--pp-muted)',
            }}
          >
            Find a record
          </div>
          <div style={{ display: 'flex', gap: v(0.6), marginBottom: v(0.3) }}>
            {['New conversation', 'Scenarios'].map((label) => (
              <div
                key={label}
                style={{
                  flex: label === 'Scenarios' ? '0 0 auto' : 1,
                  height: v(2.6),
                  borderRadius: v(0.8),
                  border: line,
                  background: 'var(--pp-card)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: `0 ${v(0.8)}`,
                  fontSize: v(0.95),
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </div>
            ))}
          </div>
          {SCREENS.map((item, index) => {
            const on = index === active;
            return (
              <Fragment key={item.name}>
                {item.group && (
                  <div
                    style={{
                      fontSize: v(0.85),
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--pp-muted)',
                      fontWeight: 600,
                      margin: `${v(0.85)} ${v(0.6)} ${v(0.15)}`,
                    }}
                  >
                    {item.group}
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: v(0.9),
                    height: v(2.9),
                    padding: `0 ${v(0.7)}`,
                    borderRadius: v(0.8),
                    fontSize: v(1.15),
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    background: on ? 'var(--pp-deep)' : 'transparent',
                    color: on ? '#fff' : 'var(--pp-ink)',
                  }}
                >
                  <span
                    style={{
                      width: v(1.8),
                      height: v(1.8),
                      borderRadius: v(0.5),
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: v(0.95),
                      fontWeight: 700,
                      boxSizing: 'border-box',
                      border: on ? 'none' : line,
                      background: on ? 'var(--pp-rose)' : 'var(--pp-card)',
                      color: on ? 'var(--pp-deep)' : 'var(--pp-muted)',
                    }}
                  >
                    {index}
                  </span>
                  {item.name}
                </div>
              </Fragment>
            );
          })}
          <div
            style={{
              marginTop: 'auto',
              fontSize: v(0.85),
              color: 'var(--pp-muted)',
              borderTop: line,
              paddingTop: v(0.8),
              lineHeight: 1.45,
            }}
          >
            Independent concept by Roland-Caryl Obam Ngo’O. Not a Pinpoint
            product.
          </div>
        </div>

        {/* Clerk */}
        <div
          style={{
            width: v(33),
            flex: '0 0 auto',
            background: 'var(--pp-chat)',
            borderRight: line,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              height: v(5),
              flex: '0 0 auto',
              display: 'flex',
              alignItems: 'center',
              gap: v(1),
              padding: `0 ${v(1.6)}`,
              borderBottom: line,
              background: 'var(--pp-card)',
            }}
          >
            <Mark size={v(2.7)} />
            <div style={{ lineHeight: 1.2 }}>
              <b style={{ fontSize: v(1.3) }}>Clerk</b>
              <div
                style={{
                  fontSize: v(0.9),
                  color: 'var(--pp-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ color: 'var(--pp-ok)' }}>●</span> Ready · reads
                only: record, your mail, CVs
              </div>
            </div>
          </div>
          <div
            style={{
              padding: `${v(2.1)} ${v(2.2)} 0`,
              display: 'flex',
              flexDirection: 'column',
              gap: v(1.05),
            }}
          >
            <div
              style={{
                fontSize: v(0.9),
                letterSpacing: '0.12em',
                color: 'var(--pp-muted)',
              }}
            >
              YOUR DESK, PREPARED · LONDON LEGAL
            </div>
            <div
              style={{
                fontSize: v(2.5),
                fontWeight: 500,
                letterSpacing: '-0.03em',
                lineHeight: 1.12,
                whiteSpace: 'nowrap',
              }}
            >
              Clerk prepares the work.
              <br />
              <span style={{ color: 'var(--pp-acc)' }}>You make the call.</span>
            </div>
            <div
              style={{
                fontSize: v(1.02),
                color: 'var(--pp-muted)',
                lineHeight: 1.55,
              }}
            >
              Your follow-ups, mandates and candidate evidence, in one place.
              Every recommendation has a source and a date. Every decision
              stays with you.
            </div>
            <div
              style={{
                border: '1px solid #E6D2D3',
                background: '#F5EAEA',
                borderRadius: v(1),
                padding: `${v(1)} ${v(1.2)}`,
                fontSize: v(1.02),
                lineHeight: 1.5,
              }}
            >
              <span className="pp-pill warn" style={{ fontWeight: 700 }}>
                NEW MANDATE · 08:12
              </span>
              <div style={{ fontWeight: 700, marginTop: v(0.5) }}>
                M-0457 · Corporate M&A
              </div>
              <div>Associate · 3 to 5 years · London</div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: v(0.9),
              }}
            >
              {PROMPTS.map((card) => (
                <div
                  key={card.title}
                  className="pp-card"
                  style={{
                    padding: `${v(0.9)} ${v(1)}`,
                    fontSize: v(0.95),
                    lineHeight: 1.45,
                    minHeight: v(6.6),
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: v(0.45) }}>
                    {card.title}
                  </div>
                  {card.lines.map((text) => (
                    <div
                      key={text}
                      style={{
                        color: card.bad ? 'var(--pp-acc)' : 'var(--pp-ink2)',
                      }}
                    >
                      {text}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--pp-bg)',
          }}
        >
          <div
            style={{
              height: v(5),
              flex: '0 0 auto',
              display: 'flex',
              alignItems: 'center',
              gap: v(1),
              padding: `0 ${v(2.2)}`,
              borderBottom: line,
              background: 'var(--pp-card)',
              fontSize: v(1.05),
              color: 'var(--pp-ink2)',
              whiteSpace: 'nowrap',
            }}
          >
            {active} · {screen.name}
          </div>
          <div
            style={{
              padding: `${v(2.3)} ${v(2.4)}`,
              display: 'flex',
              flexDirection: 'column',
              gap: v(1.1),
            }}
          >
            <div
              style={{
                fontSize: v(0.9),
                letterSpacing: '0.14em',
                color: 'var(--pp-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              WORKSPACE 0{active} · SYNTHETIC DATA
            </div>
            <div
              style={{
                fontSize: v(2.6),
                fontWeight: 600,
                letterSpacing: '-0.025em',
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
              }}
            >
              {screen.name}
            </div>
            <div
              style={{
                fontSize: v(1.1),
                color: 'var(--pp-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {screen.sub}
            </div>
            <div style={{ display: 'flex', gap: v(0.9), marginTop: v(0.5) }}>
              {screen.tiles.map((value, index) => (
                <div
                  key={`${active}-${index}`}
                  className="pp-tile"
                  style={{ flex: 1, minWidth: 0, height: v(8.2) }}
                >
                  {value ? (
                    <div className="pp-tile-n">{value}</div>
                  ) : (
                    <div
                      style={{
                        height: v(2.4),
                        width: '55%',
                        borderRadius: v(0.5),
                        background: '#E9E1E2',
                      }}
                    />
                  )}
                  <div
                    style={{
                      height: v(0.7),
                      width: '82%',
                      borderRadius: 999,
                      background: '#E9E1E2',
                      marginTop: v(1.2),
                    }}
                  />
                  <div
                    style={{
                      height: v(0.7),
                      width: '58%',
                      borderRadius: 999,
                      background: '#E9E1E2',
                      marginTop: v(0.6),
                    }}
                  />
                </div>
              ))}
            </div>
            <div
              className="pp-card"
              style={{ padding: v(1.3), marginTop: v(0.4) }}
            >
              <div
                style={{
                  height: v(2.6),
                  borderRadius: v(0.5),
                  background: 'var(--pp-soft)',
                  marginBottom: v(0.4),
                }}
              />
              {BAR_WIDTHS.map((width, index) => (
                <div
                  key={width}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: v(1.4),
                    height: v(3.5),
                    borderBottom: index < BAR_WIDTHS.length - 1 ? line : 'none',
                  }}
                >
                  <span
                    className="pp-code"
                    style={{ fontSize: v(1.05), flex: '0 0 auto' }}
                  >
                    {['C-1746', 'C-1803', 'C-3670', 'C-4271', 'C-0166'][index]}
                  </span>
                  <span
                    style={{
                      height: v(0.75),
                      width: `${width}%`,
                      borderRadius: 999,
                      background: '#E6DEDF',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RevealScene() {
  const beat = useBeats(CUES);
  const railBeat = useBeats(RAIL_CUES);
  const active = RAIL_ORDER[Math.min(railBeat, RAIL_ORDER.length - 1)];
  const push = beat >= 9;

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{ background: 'var(--pp-bg)', color: 'var(--pp-ink)', zIndex: 10 }}
      initial={{ clipPath: 'circle(0% at 93.8% 84%)' }}
      animate={{ clipPath: 'circle(160% at 93.8% 84%)' }}
      exit={{
        opacity: 0,
        scale: 1.16,
        transition: { duration: 0.36, ease: 'easeIn' },
      }}
      transition={{ duration: 0.7, ease: EASE_IO }}
    >
      {/* Pin rings: this shot's own graphic system */}
      {[62, 92, 124].map((size, index) => (
        <div
          key={size}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '72%',
            top: '50%',
            width: v(size),
            height: v(size),
            marginLeft: v(-size / 2),
            marginTop: v(-size / 2),
            borderRadius: '50%',
            border: `${v(0.18)} solid ${index === 0 ? '#E7C9CB' : '#EADCDD'}`,
            animation: `pp-ring ${7 + index * 2}s ease-in-out ${-index * 1.5}s infinite alternate`,
          }}
        />
      ))}

      {/* Type column */}
      <motion.div
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: v(72) }}
        initial={{ x: '0vmin', opacity: 1 }}
        animate={{ x: push ? '-9vmin' : '0vmin', opacity: push ? 0 : 1 }}
        transition={{ duration: 0.5, ease: EASE_IN }}
      >
        <Rise
          show={beat >= 1}
          y={-1.6}
          spring={POP}
          style={{
            position: 'absolute',
            left: v(6),
            top: v(8.6),
            display: 'flex',
            alignItems: 'center',
            gap: v(1.8),
          }}
        >
          <Mark size={v(6.6)} />
          <div>
            <div
              style={{
                fontSize: v(3.9),
                fontWeight: 600,
                letterSpacing: '-0.025em',
                lineHeight: 1.05,
                whiteSpace: 'nowrap',
              }}
            >
              Pinpoint Desk OS
            </div>
            <div
              className="f-eyebrow"
              style={{
                fontSize: v(1.9),
                color: 'var(--pp-acc)',
                marginTop: v(0.7),
              }}
            >
              Concept · synthetic data
            </div>
          </div>
        </Rise>

        <div
          className="f-h"
          style={{
            position: 'absolute',
            left: v(5.7),
            top: v(24.5),
            fontSize: v(8.6),
            whiteSpace: 'nowrap',
          }}
        >
          <MaskLine show={beat >= 2}>Clerk prepares</MaskLine>
          <MaskLine show={beat >= 2} delay={0.15}>
            the work.
          </MaskLine>
          <MaskLine show={beat >= 4} style={{ color: 'var(--pp-acc)' }}>
            You make
          </MaskLine>
          <MaskLine
            show={beat >= 4}
            delay={0.15}
            style={{ color: 'var(--pp-acc)' }}
          >
            the call.
          </MaskLine>
        </div>

        <Rise
          show={beat >= 5}
          className="f-sub"
          style={{
            position: 'absolute',
            left: v(6),
            top: v(62.6),
            width: v(56),
            color: 'var(--pp-ink2)',
          }}
        >
          Eight screens and one assistant, built from your posting.
        </Rise>

        <Rise
          show={beat >= 8}
          y={1.4}
          style={{
            position: 'absolute',
            left: v(6),
            top: v(82),
            width: v(60),
            fontSize: v(2.1),
            lineHeight: 1.4,
            color: 'var(--pp-muted)',
          }}
        >
          Synthetic data. Registers simulated. Microsoft 365, Outlook and
          Microdec are not connected in this demo.
        </Rise>
      </motion.div>

      {/* Product stage */}
      <div
        style={{
          position: 'absolute',
          left: v(74),
          top: v(13),
          width: v(112),
          height: v(62),
          perspective: v(240),
        }}
      >
        <motion.div
          style={{
            width: '100%',
            height: '100%',
            transformOrigin: '0% 50%',
            willChange: 'transform',
          }}
          initial={{
            x: '0vmin',
            y: '26vmin',
            rotateY: -24,
            rotateX: 6,
            scale: 1,
            opacity: 0,
          }}
          animate={
            push
              ? {
                  x: '-14vmin',
                  y: '0vmin',
                  rotateY: -5,
                  rotateX: 1,
                  scale: 1.24,
                  opacity: 1,
                }
              : {
                  x: '0vmin',
                  y: '0vmin',
                  rotateY: -13,
                  rotateX: 3,
                  scale: 1,
                  opacity: 1,
                }
          }
          transition={
            push
              ? { duration: 0.72, ease: EASE_IN }
              : {
                  type: 'spring',
                  stiffness: 110,
                  damping: 19,
                  delay: 0.05,
                  opacity: { duration: 0.25, delay: 0.05 },
                }
          }
        >
          <DeskWindow active={active} />
        </motion.div>
      </div>

      {/* Callouts under the hero, one at a time */}
      {[
        { label: 'Outbound sent: 0', cue: 6, left: 82 },
        { label: 'Approval: human only', cue: 7, left: 122 },
      ].map((tag) => (
        <motion.div
          key={tag.label}
          style={{
            position: 'absolute',
            left: v(tag.left),
            top: v(80.5),
            display: 'flex',
            alignItems: 'center',
            gap: v(1.2),
            padding: `${v(1.3)} ${v(2.4)}`,
            borderRadius: 999,
            background: 'var(--pp-deep)',
            color: '#fff',
            fontSize: v(3),
            fontWeight: 600,
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
          initial={{ opacity: 0, scale: 0.7, y: '2vmin' }}
          animate={
            push
              ? { opacity: 0, scale: 0.9, y: '2vmin' }
              : beat >= tag.cue
                ? { opacity: 1, scale: 1, y: '0vmin' }
                : { opacity: 0, scale: 0.7, y: '2vmin' }
          }
          transition={push ? { duration: 0.3, ease: EASE } : POP}
        >
          <span
            style={{
              width: v(1.3),
              height: v(1.3),
              borderRadius: '50%',
              background: 'var(--pp-rose)',
            }}
          />
          {tag.label}
        </motion.div>
      ))}
    </motion.div>
  );
}
