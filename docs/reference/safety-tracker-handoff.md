# AIMO Safety Tracker — Handoff for Claude Code

> **Purpose:** everything you need to continue development of the AIMO Safety Tracker with the same
> workflow, quality bar, and deploy pipeline used to date. Read this fully before your first change.
> Current release: **V4.5 / cloud-v26 (30 Jul 2026)**.

---

## 0. Kickoff prompt (paste this to start)

> You are taking over development of the **AIMO Safety Tracker** (a single-file HTML Safety Management
> System for KSIA aviation Management-of-Change). Read `docs/CLAUDE_CODE_HANDOFF.md` in the project
> root first — it defines the golden workflow, the file layout, the QA process, and the deploy
> pipeline. The canonical app is `cloud-deploy/index.html`. **Do not edit it on request** — follow the
> "consolidate → wait for go → build → QA → ship" workflow in the handoff. When I say "go"/"build it",
> implement the agreed items, QA headless (desktop + 375px mobile, 0 page errors), bump the version +
> `CHANGELOG`, write `cloud-deploy/index.html`, and update `DEPLOY_LOG.md`, `PENDING_CHANGES.md`, and
> the Notion tracker. Confirm you've read the handoff and summarize the current open items before doing
> anything.

*(For the "AIMO-Safety-Reporting Publish" chat: your role is unchanged — when
`cloud-deploy/index.html` changes, pick it up and push to GitHub → live. See §5.)*

---

## 1. What this is

A **single-file browser app** (`index.html`, ~2.7 MB, no build step) — a Safety Management System (SMS)
for King Salman International Airport (KSIA) change management. It tracks **MOCs** (Management of
Change records), their risk assessments, risk-verification inspections, safety observations, and
status updates, and produces weekly/monthly reports + a .pptx deck.

- **One build only:** the **cloud build**. The old offline build is deprecated/archived.
- Pure vanilla JS + CSS in one HTML file. State lives in `localStorage` and syncs to Supabase.
- Brand palette is violet (`--accent:#6F328A`, `--brand-grad`). Font: Barlow.

---

## 2. Where everything lives

Project root: `/Users/idean/Claude/Projects/AIMO-Safety-Tracker/`

| Path | What it is |
|---|---|
| `cloud-deploy/index.html` | **THE app.** Editing/writing this file is the deploy trigger (see §5). |
| `cloud-deploy/DEPLOY_LOG.md` | Deploy history, `cloud-vN`, **newest at top**. Add an entry every release. |
| `PENDING_CHANGES.md` | The change tracker: Summary table + 🐛 Bugs / ✨ Improvements / ✅ Shipped / 🆕 New. Mirror of the Notion page. |
| `AIMO_Safety_Tracker_CHANGELOG.md` | Detailed per-release changelog (deeper than the in-app one). |
| `docs/` | Scope docs (e.g. `V4.1_SCOPE.md`) + this handoff. |
| `feedback-system/` | The deployed Cloudflare Pages feedback service (Functions → Notion). Rarely touched. |

**Live app:** https://aimo-safety-tracker.ideandaai.workers.dev (auto-deploys from GitHub `main`)
*(the old `bitter-rain-3d7d…` Worker is stale/frozen — ignore it, retire it when convenient)*
**Photo Worker (R2):** https://aimo-photos.ideandaai.workers.dev  (bucket `aimo-finding-photos`)
**Feedback endpoint:** https://aimo-feedback.pages.dev/api/feedback → Notion "Feedback Inbox"

---

## 3. The golden workflow (do not skip)

1. **A request is not a build order.** When Dean asks for a change, **consolidate it** into
   `PENDING_CHANGES.md` + the Notion Pending-Changes page as a new `Pxx` item with a short
   root-cause/approach note. **Do not touch `index.html` yet.**
2. **Build only on an explicit go** — "go", "build it", "start", "implement".
3. Bigger/visual features: build a small **standalone mockup** first (its own `.html`), deliver it,
   get approval, then implement. (That's how the card design, Quick Capture, and What's-new prompt were done.)
4. **One release at a time.** Each release:
   - Implement the agreed `Pxx` items.
   - Bump `APP_VERSION` + `APP_DATE` (top of the file) and **add a plain-language `CHANGELOG` entry**
     (drives the in-app "What's new" prompt — see §7).
   - **QA headless** — desktop + 375 px mobile, **0 page errors** (see §4).
   - Write `cloud-deploy/index.html` (this publishes — §5).
   - Update `DEPLOY_LOG.md` (new `cloud-vN` at top), `PENDING_CHANGES.md` (mark shipped), and the
     Notion page.
5. **Versioning:** `APP_VERSION` like `V4.5`; deploy counter `cloud-vN` (currently `cloud-v26`).
   Bump the minor for each shipped batch.

---

## 4. How to QA (headless)

The app must render with **no Supabase backend** during QA. Stub it by blocking the CDN so `AIMOCloud`
falls back to local-only. That produces one benign console error (`… createClient …`) — **filter it out**;
anything else is a real regression.

Minimal Playwright harness (adapt paths to your local Chrome/Playwright install):

```js
const { chromium } = require('playwright');            // or playwright-core + executablePath
const page = /* newContext({viewport:{width:1180,height:1200}}) */;
await ctx.route(/supabase|unpkg|jsdelivr|cdn/i, r => r.abort());   // stub the backend
const errs = [];
page.on('pageerror', e => { if (!/createClient/.test(e.message)) errs.push(e.message); });
await page.goto('file://' + path.resolve('cloud-deploy/index.html'));
await page.waitForTimeout(1400);
```

**Seeding data**
- Built-in demo: `await page.evaluate(() => { seedProjects(); saveProjects(); renderSidebar(); })`.
  The 3 demo projects have hazards/observations but sit in **Planning** with no MOC records, so
  Risk-Verification / Observations render their gated empty states.
- **Force a MOC into Execution** to exercise RV/Observations/Reports:
  ```js
  p.mocs = [{ id:'m1', mocRef:'MOC-001', status:'accepted', reportStageOverride:'execution' }];
  p.stageDocs.project_execution.verificationLog = { records:[/*…*/], frequency:'biweekly' };
  p.keyDates.executionStart = '2026-05-01';
  saveProjects();
  ```
- Status-update rollup / Reports: add `p.statusUpdates=[…]` and set
  `localStorage['aimo_general_updates']`, then in Reports set `stReportType='monthly'; stReportAnchor='2026-07'`.

**Always** screenshot **desktop and 375 px mobile**, and re-check **`@media print`** (FABs must hide)
after any layout change. Mobile is where regressions hide — check for horizontal overflow, header
clipping, and modal footers falling below the fold.

---

## 5. Deploy & publish

**Writing `cloud-deploy/index.html` *is* the deploy trigger.** A separate agent — the
**"AIMO-Safety-Reporting Publish"** chat — watches that file, commits it, and pushes to GitHub →
Cloudflare → live. There is no manual Cloudflare drag.

- After writing the file, **verify** it landed: `shasum -a 256 cloud-deploy/index.html` and confirm
  `APP_VERSION` + your new markers are present.
- Then add the `DEPLOY_LOG.md` entry (include the sha) so the publish agent + history stay in sync.
- The feedback service and photo worker are already deployed; you normally won't redeploy them.

*(If you are the publish chat: keep doing exactly this — pick up the changed `index.html`, commit,
push. Nothing about that job changed.)*

---

## 6. Architecture cheat-sheet

- **State:** `state.projects[]`; `saveProjects()` → `localStorage['aimo_safety_projects']` (STORAGE_KEY).
  `esc()` for HTML-escaping. `_todayISO()` for dates.
- **Cloud sync:** `AIMOCloud` (Supabase) — `syncKeys`, `hydrate`, `_mergeProjects` (per-project
  newer-`updatedAt`-wins), a `Storage.prototype.setItem` hook → `schedulePush`, optimistic concurrency,
  realtime. **Deletion tombstones:** `aimo_deleted_projects` map. **UI-only prefs are NOT in syncKeys**
  (e.g. `aimo_seen_version`) so they don't sync across the team.
- **Data model:** a project has `mocs[]` (MOC records; `mocs[0]` = primary/anchor), `keyDates`,
  `parentGroup` (program), and `stageDocs` keyed by milestone stage. Supplementary MOCs are separate
  projects with `mocs[0].isAddendum` + `parentMocId`; `suppOfProject(parent)` finds them.
  - **Observations:** `p.stageDocs.project_execution.observations[]` (photos in `ob.photos[]`).
  - **Status updates:** `p.statusUpdates[]`; General/Admin ones in `generalUpdates` / `__general__`
    (`localStorage['aimo_general_updates']`).
  - **Risk verification:** hazards `sd.riskRegister.hazards[]` (each has `controlEvals[]`);
    inspections `sd.verificationLog.records[]`; **`sd.verificationLog.frequency`** (weekly/biweekly/monthly)
    drives planned inspections via `mocPlanned()`; findings are `isFinding` observations.
- **Stage gating:** `getReportStage(p)` → `_moc0(p).reportStageOverride` or derived from dates.
  Risk Verification + Observations only populate when the MOC is in **execution**.
- **Rendering:**
  - Main tabs via `stMainSection` (`dashboard`|`home`|`safety`|`reports`) → `renderSafetyView()` into
    `#safetyView`. Home sub-tabs `stHomeSubTab`; Safety sub-tabs `stSafetySubTab`
    (`overview`|`moc`|`verification`|`observations`).
  - Per-project detail view: `renderProjectDetail()` → `buildOverviewHTML(p)` + `buildDocTabHTML(p, stageKey)`.
- **Card system (V4.0–V4.3):** `_p8(title, body, opts)` builds a white card with a tinted header strip.
  `opts`: `{count, flush (edge-to-edge tables), actions (header buttons, HTML), collapse (key → chevron
  + `_p8Toggle`)}`. CSS classes `.p8card/.p8hd/.p8bd`. Reuse this for any new section.
- **FABs:** `.qc-fab` (＋ Quick Capture) + `.fb-fab` (feedback), bottom-right, stacked; hidden in
  `body.verify-mode` and `@media print`.
- **Verify pop-out:** `?verify` URL → `body.verify-mode`; a separate field-entry screen (`#verify-page`).
- **Mobile:** additive `@media (max-width:820px / 480px)` layer; sidebar becomes an off-canvas drawer;
  heights use `100dvh` (not `100vh`) + `env(safe-area-inset-*)` (V4.5 fix). Keep it that way.

---

## 7. In-app "What's new" prompt (P15) — keep it fed

Near the top of the file: `const CHANGELOG = [ { v:'V4.5', date:'…', items:[{icon,title,text}] }, … ]`
(newest first). On load, `_maybeShowWhatsNew()` compares `APP_VERSION` to
`localStorage['aimo_seen_version']` and shows the modal for unseen releases. **Every release, add one
short, plain-language entry at the top of `CHANGELOG`** as part of the version bump — that's the whole
maintenance cost.

---

## 8. Notion + feedback loop

- **Pending Changes page** (mirror of `PENDING_CHANGES.md`): `3a984c76-5da9-81bf-989a-c79526915e37`.
- **Feedback Inbox DB:** `af771126733640fab90afd904115cd11`
  (data source `collection://3a8477ab-f86e-47f0-9df4-98c5cbb7741c`). Columns incl. `Feedback`(title),
  `Comment`, `Context`, `Status`, `Priority`, `Reviewed`(checkbox), `Screenshot`.
- **Context notebook (parent):** `3a684c765da981b4b61feb581aa0b166`.
- The in-app **feedback button** posts to the Cloudflare service → a new row in the Feedback Inbox.
- A **daily scheduled task** reviews new (`Reviewed = false`) feedback, proposes changes, and files them
  into `PENDING_CHANGES.md` / Notion, then ticks `Reviewed`. When you triage feedback, do the same:
  turn each item into a `Pxx` with root cause + approach, then build on Dean's go.

---

## 9. Current state & open items

- **Shipped through V4.5 / cloud-v26:** card design across all pages (P8), Quick Capture (P14),
  What's-new prompt (P15), and the latest batch — mobile viewport/modal fixes (P16/P17),
  Observations/RV note wording (P18/P19), "final RA" copy (P20), verification-frequency field (P21),
  collapsible Reports + view-only Status-Updates rollup (P22). See `DEPLOY_LOG.md` for the full history.
- **Open — needs a decision from Dean:** **P9 — view-only (read-only) mode.** Choose between
  (a) a quick client-side `?view` flag that disables inputs/buttons (fast, not secure), or
  (b) an enforced per-user read-only role via Supabase auth/RLS (proper, more work). Don't build until
  Dean picks.
- No open bugs at handoff.

---

## 10. Gotchas (learned the hard way)

- Global CSS `input,select,textarea{width:100%}` **overrides flex sizing** — give selects explicit
  `width` in flex/filter rows or they blow out full-width.
- macOS uses **BSD `sed`** (`sed -i ''`), not GNU. Prefer editing files directly over `sed` scripts.
- Mobile `100vh` is the *tallest* viewport → content hides under the browser chrome/notch. Use `100dvh`
  + safe-area insets (already applied in V4.5 — don't revert).
- Cap image previews (`max-height`) in any modal — a phone photo will otherwise push the submit button
  off-screen.
- `renderSafetyView()` only paints `#safetyView`; after a data change, call it (it no-ops safely if that
  view isn't showing).
- When faking a "returning user" in QA, set `localStorage['aimo_seen_version']` **before** load, or the
  What's-new modal will pop over your screenshots.
