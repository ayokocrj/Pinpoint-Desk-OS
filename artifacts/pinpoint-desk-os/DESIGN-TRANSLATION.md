# Fund OS → Pinpoint visual translation

Reference: https://github.com/ayokocrj/Fund-OS-Nexus-Bay-Design-corporate

The reference application's `artifacts/fof-os/src` is the visual source, not the generic component scaffold in `fund-os-core`.

| Source | Pinpoint adaptation |
| --- | --- |
| `index.css` typography and `kit.tsx` | Locally served Instrument Sans at 400/500/600/700; compact sans headings, tabular numbers, restrained typography hierarchy. |
| `shell/TopBar.tsx` | 52px maroon application bar, compact product name, synthetic-data badge, concise safety status, demo desk identity. |
| `shell/Rail.tsx` | 248px tinted rail, single-line grouped destinations and numbered badges; detailed screen subtitles remain available through existing titles. |
| `shell/Chat.tsx` welcome | Short 28px sans heading, quiet explanatory text, role prompt panels and clearly separated mandate prompt. Existing actions retained. |
| `kit.tsx` ScreenHead | Consistent workspace eyebrow, 21px screen title and contextual subtitle across all eight screens. |
| `kit.tsx` Panel, Kpi, Tag, Btn | Shared panel radii, sentence-case KPI descriptions, restrained status pills and standard button hierarchy. |
| `HomeScreen.tsx` tables | Fine row separators, modest header contrast, sentence-case column headings and compact readable rows. |
| `shell/Workspace.tsx` | Distinct work surface and assistant surface; existing Pinpoint Split/Desk/Clerk controls retained rather than adding competing navigation. |

Pinpoint's crimson, maroon and ink are preserved. No Fund OS logos, green palette, finance content or functionality were imported. The synthetic engine, record access rules and calculations are unchanged.

The original app baseline remains isolated in the mockup sandbox for comparison. This is a presentation adaptation of the existing application, not a React migration or a reusable component-library import.
