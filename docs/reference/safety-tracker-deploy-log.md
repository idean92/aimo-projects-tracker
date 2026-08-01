# AIMO Safety Tracker — Cloud Deploy Log

Record of every time a new HTML version is wired for the cloud and turned into `index.html` for Cloudflare. **Newest entry at the top.**

- **Version scheme:** `cloud-vN` — counter for the *deployed* build.
- **Times:** Asia/Riyadh (UTC+3).
- **Files per build (in `cloud-deploy/`):** `index.html` (uploaded to Cloudflare) + dated keeper `aimo-safety-tracker_cloud-vN_YYYY-MM-DD-HHMM.html`; previous `index.html` → `backups/`.
- **Live URL:** https://aimo-safety-tracker.ideandaai.workers.dev
- **Photo Worker:** https://aimo-photos.ideandaai.workers.dev (R2 bucket `aimo-finding-photos`)
- **To deploy:** copy `index.html` → the GitHub repo's `public/index.html` → commit → push to `main`.
  Cloudflare Workers Build auto-deploys from the repo in ~1–2 min. (No manual Cloudflare drag —
  that was the old `bitter-rain-3d7d` method, retired; see `docs/CLAUDE_CODE_HANDOFF.md` §5.)

---

## Version history

### cloud-v26 — 2026-07-30 (Riyadh)
- **Source:** cloud-v25 + feedback batch P16–P22 (app V4.4 → V4.5).
- **Status:** `cloud-deploy/index.html` written (sha256 `161af7cf…`); auto-published via the publishing agent → GitHub → live.
- **Published:** pushed to GitHub `main` (commit `675b0c4`) 2026-07-30; repo went V4.4 → V4.5 cleanly. Cloudflare auto-deploy → https://aimo-safety-tracker.ideandaai.workers.dev.
- **Changes:** **P16/P17 mobile** — `100vh → 100dvh` on body / sidebar drawer / verify page / mobile modals + `env(safe-area-inset-top)` on the header so the top bar, menu button and version footer stop hiding under the browser chrome/notch; capped the feedback + Quick-Capture image previews (`max-height:200px`) so a phone photo no longer pushes the Send button off-screen. **P18** — Observations "Voided — not in execution" note now hidden for the parent MOC (kept for supplementaries). **P19** — parent-not-in-execution / change-complete notes drop the word "Parent" (Observations + Risk Verification). **P20** — RV empty-state copy "approved GACA RA/Risk Assessment" → "final RA" (3 spots). **P21** — new **Risk Verification Frequency** selector (Weekly/Bi-weekly/Monthly) in Edit Project writing `verificationLog.frequency`, which drives the "planned" inspections figure (`mocPlanned()`). **P22** — every Reports card is now collapsible (extended `_p8()` with a chevron + `_p8Toggle`), plus a new **view-only Status Updates** rollup for the selected week/month, sortable by date / project / priority. What's-new `CHANGELOG` entry added for V4.5. QA'd headless desktop + mobile (375px): SU rollup + sort, collapse, parent-MOC notes, "final RA", frequency persistence, feedback image cap, What's-new V4.5; 0 real page errors.

### cloud-v25 — 2026-07-28 (Riyadh)
- **Source:** cloud-v24 + P15 "What's new" prompt (app V4.3 → V4.4).
- **Status:** `cloud-deploy/index.html` written (sha256 `3bcbc5ec…`); auto-published via the publishing agent → GitHub → live.
- **Published:** pushed to GitHub `main` (commit `2807f4f`) 2026-07-28; the repo was at **V4.0** before this push, so cloud-v25 also carried the V4.1–V4.3 changes that had not reached GitHub. Cloudflare auto-deploy → live.
- **Changes:** New **"What's new" prompt**. On load, the app compares `APP_VERSION` against `localStorage['aimo_seen_version']` (a per-browser UI pref, **not** in the cloud sync keys) and, if the build is newer, shows a modal listing only the releases the user hasn't seen — newest first, latest tagged "New". "Got it" (or dismiss) saves the current version so it won't reappear until the next update. First-ever load baselines silently (no history wall). The sidebar version badge (`#appVersionBadge`) is now clickable to re-open the prompt on demand (force mode shows the full changelog). Content lives in a new plain-language `CHANGELOG` array — to announce a release, bump `APP_VERSION`/`APP_DATE` and add one entry at its top. Reuses the existing `.overlay`/`.modal` system with a brand-gradient header. QA'd headless: first-load silent, shows-once on update, dismiss persists, multi-version catch-up (V4.1 → shows V4.4/V4.3/V4.2), badge reopen shows all, already-current shows nothing; 0 real page errors; desktop + mobile.

### cloud-v24 — 2026-07-28 (Riyadh)
- **Source:** cloud-v23 + P8 part 2 — dashboard card design across the per-project Safety tabs + Reports (app V4.2 → V4.3).
- **Status:** `cloud-deploy/index.html` written (sha256 `cf784412…`); auto-published via the publishing agent → GitHub → live.
- **Changes:** Extended the V4.0 `_p8()` section-card system (white card + tinted header strip + count badge, restrained semantic colour) to the remaining inner pages. **Overview** — each program group is now a card (project/key-dates bars kept as banners). **Risk Verification** — Findings, the per-stage hazard register (flush), Risk Verification History (tiles + log), and supplementary-MOC risk blocks are all cards; raw stage keys now show a friendly label ("Project Construction"). **Observations** — the Safety Observation Register summary and each per-MOC tracker are cards with flush edge-to-edge tables; Import/Add buttons moved into the card header. **Reports** — Changes-since-last-report, MOC pipeline & register, Risk-Verification KPIs, Verification Summary, and the hazard/risk distributions are all cards (P13 ordering preserved). **Management of Change** unchanged (already a single MOC card). `_p8()` extended with an `actions` slot for header buttons. Mobile fixes: the Overview stat grid stacks (3-col) and card headers wrap so action buttons stay visible at 390px. QA'd headless on all five pages desktop + mobile with a forced-execution rich seed; V4.0 Home cards re-verified (no regression); print hides the FABs and renders cards cleanly; 0 real page errors.

### cloud-v23 — 2026-07-28 (Riyadh)
- **Source:** cloud-v22 + P14 Quick Capture (app V4.1 → V4.2).
- **Status:** `cloud-deploy/index.html` written (sha256 `24a7be1b…`); auto-published via the publishing agent → GitHub → live.
- **Changes:** New global **＋ Quick Capture** FAB on every screen (Option A layout: primary ＋ at the corner, the smaller outline feedback bubble stacked above it). Opens a one-page sheet that adapts to the chosen type — **Safety Observation** (project-bound; date, category, details, action taken, optional photo via the existing R2/offline pipeline) or **Status Update** (assign to a project *or* General / Administrative; type, priority, update text, Needs-a-decision shown only for Challenge/Escalation per P10, optional topic/owner). Save drops the entry straight into the normal Observation Register / Status Updates; "Save & add another" keeps the sheet open and resets the fields. Reuses `ensureStageDocs`/`stObsUploadPhotos` and `_suList`/`_suPersist` — no data-model change. Both FABs hide in the ?verify pop-out and on print. QA'd headless on mobile (390px) + desktop: observation, general SU, project SU, photo attach, and field-reset all verified; 0 real page errors.

### cloud-v22 — 2026-07-26 (Riyadh)
- **Source:** cloud-v21 + Reports content cleanup + UX polish (app V4.0 → V4.1).
- **Status:** `cloud-deploy/index.html` written (sha256 `fc95d74c…`); auto-published via the publishing agent → GitHub → live.
- **Changes:** P13 Reports cleanup (remove Findings Register + Verification Log; remove Open by Residual Severity; top-5 on Open by Hazard / Risk; Verification Summary moved after the metrics); P10 status-update checkboxes only for Challenge/Issue & Escalation; P11 Observations "Showing N of M" into the filter row; P12 Key-highlights legend reformatted. P8 card rollout deferred to V4.2.

### cloud-v21 — 2026-07-26 (Riyadh)
- **Source:** cloud-v20 + P8 dashboard card design on the Home tabs (app V3.14 → V4.0, MAJOR visual).
- **Status:** `cloud-deploy/index.html` written (sha256 `0343e5ff…`); auto-published via the publishing agent → GitHub → live.
- **Changes:** `_p8()` section-card helper + `.p8` styles across the four Home sub-tabs (white cards, tinted header strips + count badges, restrained semantic colour). Fixed the Consolidated Observations filter-row full-width bug (P5 follow-up). Command Dashboard unchanged. Per-project detail tabs to follow in V4.1.

### cloud-v20 — 2026-07-26 (Riyadh)
- **Source:** cloud-v19 + six fixes from the Pending Changes list (app V3.13 → V3.14).
- **Status:** `cloud-deploy/index.html` written (sha256 `5605a255…`); auto-published via the publishing agent → GitHub → live.
- **Changes:** P3 deletion tombstones (deletes propagate, no resurrection); P4 Edit Project creates a MOC record so GACA / Change Type / Status persist on MOC-less projects; P6 `_lastSafetyViewKey` TDZ fix on offline boot; P1 Priority & decisions = High AND needs-decision; P5 Consolidated Observations one-row filters + dropped "Action taken"; P7 MOC Overview banner shows Project Title.

### cloud-v19 — 2026-07-26 (Riyadh)
- **Source:** cloud-v18 + in-app feedback wired live (app V3.12 → V3.13).
- **Status:** `cloud-deploy/index.html` written (sha256 `b14a4180…`); auto-published via the publishing agent → GitHub → live.
- **Changes:** `FEEDBACK_ENDPOINT` set to the deployed lean feedback service `https://aimo-feedback.pages.dev/api/feedback` (Cloudflare Pages → Notion Feedback Inbox). The floating feedback button now submits real feedback (comment + optional screenshot + context) → Pending row in Notion. `APP_DATE` → 26 Jul 2026.

### cloud-v18 — 2026-07-26 (Riyadh)
- **Source:** cloud-v17 + in-app feedback integration (app V3.11 → V3.12).
- **Release flow (changed):** the publishing agent now **auto-picks-up `cloud-deploy/index.html` and pushes it to GitHub → live**. Writing the file to the project folder *is* the deploy trigger — no manual Cloudflare drag, no dated keeper file (GitHub history is the backup).
- **Status:** `cloud-deploy/index.html` written and verified on-device (sha256 `fa0dd40e…`); picked up by the publishing agent.
- **Changes:** Floating "Send feedback" button on every screen → modal (comment + optional resized screenshot) → POST to `FEEDBACK_ENDPOINT`, with app-version + current-location context auto-appended. `FEEDBACK_ENDPOINT` holds a placeholder URL for now (empty string hides the button); point it at the deployed feedback service to go live.
- **Note:** this is the first cloud-only release — the offline build `aimo-safety-tracker.html` is deprecated and archived (`_archive/`).

### cloud-v17 — 2026-07-23 (Riyadh)
- **Source:** cloud-v16 + mobile/iPhone usability pass (app V3.10 -> V3.11).
- **Status:** `cloud-deploy/index.html` updated and QA'd locally — ready to deploy (drag into Cloudflare).
- **Changes:** Observations register becomes stacked cards on phones; Home-obs date filter stacks; Reports/summary KPI strips wrap to 2 columns; nav/sub-tab bars scroll instead of clipping; iOS safe-area insets + momentum scrolling. Desktop layout unchanged (pixel-identical). Applied identically to the offline main build (also V3.11).

### cloud-v16 — 2026-07-23 (Riyadh)
- **Source:** cloud-v15 + scroll-position fix (app V3.9 -> V3.10).
- **Status:** `cloud-deploy/index.html` updated and QA'd locally - ready to deploy (drag into Cloudflare).
- **Changes:** `renderSafetyView()` preserves scroll position on in-place re-renders (adding/deleting an observation or status update no longer jumps to the top); still resets on navigation. Applied identically to the offline main build (also V3.10).

### cloud-v15 — 2026-07-23 (Riyadh)
- **Source:** cloud-v14 + realtime re-enabled (cloud-only; app V3.8 → V3.9, cloud build).
- **Status:** `cloud-deploy/index.html` updated and QA'd locally — **ready to deploy** (drag into Cloudflare). Needs `team_state` added to the `supabase_realtime` publication server-side for live updates.
- **Changes (cloud-only):** `CONFIG.realtime = true` (live updates when a teammate saves) plus a guard in the realtime handler (`if (pushTimer || _pushing || _retryTimer) return;`) so a live update never overwrites an edit that is mid-save. Offline main build unchanged (stays V3.8).

### cloud-v14 — 2026-07-23 (Riyadh)
- **Source:** cloud-v13 + cloud sync merge/concurrency fix (app V3.7 → V3.8).
- **Status:** `cloud-deploy/index.html` updated and QA'd locally — **ready to deploy, and deploy IS the fix** (drag into Cloudflare; everyone on the link must be on this build for the merge to protect all sides). No keeper/backup snapshot created (folder tidied 23 Jul).
- **Changes:** Fixes edits reverting on refresh and a colleague not seeing uploaded/parsed data. Pulls now merge `aimo_safety_projects` per-project (newer-wins, tie→local, union) instead of blindly overwriting; pushes run optimistic concurrency (merge any remote change in before writing) via a tracked `_baseUpdatedAt`; refocus re-pull is skipped while local edits are unsynced. Offline main build unchanged except a mergeable `updatedAt` stamp on save (also V3.8).

### cloud-v13 — 2026-07-23 (Riyadh)
- **Source:** cloud-v12 + Risk-Verification speed-ups (interface/logic; app V3.6 → V3.7).
- **Status:** `cloud-deploy/index.html` updated and QA'd locally — **ready to deploy** (drag into Cloudflare to release). No keeper/backup snapshot created (folder tidied 23 Jul).
- **Changes:** Verify pop-out gains "↺ Repeat last submission" (re-apply last logged check's evaluations) and "Clear all" (reset to Unverified). Main RV History gains "+ Add inspection" (modal: date + verifier) to backfill a check from current control evaluations. Applied identically to the offline main build (also V3.7).

### cloud-v12 — 2026-07-23 (Riyadh)
- **Source:** cloud-v11 + Observations features (interface/logic; app V3.5 → V3.6).
- **Status:** `cloud-deploy/index.html` updated and QA'd locally — **ready to deploy** (drag into Cloudflare to release). No keeper/backup snapshot created (folder tidied 23 Jul).
- **Changes:** New Home ▸ Observations consolidated sub-tab (all-MOC register with Project / Status / Obs-date-range / Action-taken filters). Reworked per-MOC tracker: removed Date-of-Report, editable Linked-Hazard dropdown (+ create-new), close-out note on Closed, and an Ageing column (days open / days-to-close). Applied identically to the offline main build (also V3.6).

### cloud-v11 — 2026-07-23 (Riyadh)
- **Source:** cloud-v10 + Home-register missing-projects fix (interface/logic; app V3.4 → V3.5).
- **Status:** `cloud-deploy/index.html` updated and QA'd locally — **ready to deploy** (drag into Cloudflare to release). No keeper/backup snapshot created (folder tidied 23 Jul).
- **Changes:** Home ▸ MOC Overview now builds from every project, so a project with no MOC record (empty `mocs[]`) no longer vanishes from the grouped register — it shows as a "No MOC entered yet" placeholder row. Stats still count only real MOCs. Applied identically to the offline main build (also V3.5).

### cloud-v10 — 2026-07-23 (Riyadh)
- **Source:** cloud-v9 + inner-page UI refinement (interface only; app V3.3 → V3.4).
- **Status:** `cloud-deploy/index.html` updated and QA'd locally — **ready to deploy** (drag into Cloudflare to release). No keeper/backup snapshot created this round (the `cloud-deploy/` folder was tidied on 23 Jul).
- **Changes (interface):** Brought the Safety Command Dashboard's card aesthetic to the other pages — accent-bar section headers, gapped/rounded/elevated stat tiles, consistent 14px radius + soft shadow on surfaces and table wraps, comfortable table rhythm. Dashboard untouched (pixel-identical bar the version badge). Radius/shadow/spacing only; cloud adapter unchanged. Applied identically to the offline main build (also V3.4).

### cloud-v9 — 2026-07-22, 09:33 (Riyadh)
- **Source:** cloud-v8 + observations Photos-column reposition (interface; app V3.2 → V3.3).
- **Deployed as:** `cloud-deploy/index.html` (keeper: `aimo-safety-tracker_cloud-v9_2026-07-22-0933.html`)
- **Backup of previous:** `cloud-deploy/backups/index_cloud-v8_260722-0933.html`
- **Changes (interface):** Moved the observations Photos column to sit immediately after "Observation Details" so it is visible without horizontal scrolling. Position only; adapter unchanged. Applied identically to the offline main build (also V3.3).

### cloud-v8 — 2026-07-22, 09:05 (Riyadh)
- **Source:** cloud-v7 + observation-tracker photos (interface feature; app version V3.1 → V3.2).
- **Deployed as:** `cloud-deploy/index.html` (keeper: `aimo-safety-tracker_cloud-v8_2026-07-22-0905.html`)
- **Backup of previous:** `cloud-deploy/backups/index_cloud-v7_260722-0905.html`
- **Changes (interface):** Observations tab now shows a **Photos** column — thumbnails for every photo on an observation (incl. verify-raised findings), tap-to-view the full image from R2, an Add-Photo control per observation, and delete. Reuses `AIMOPhotos`; degrades to inline offline. Cloud adapter unchanged (17/17 regression). Applied identically to the offline main build (also V3.2).

### cloud-v7 — 2026-07-22, 07:47 (Riyadh)
- **Source:** cloud-v6 + one cloud-only hardening (pre-deploy review). Interface untouched.
- **Deployed as:** `cloud-deploy/index.html` (keeper: `aimo-safety-tracker_cloud-v7_2026-07-22-0747.html`)
- **Backup of previous:** `cloud-deploy/backups/index_cloud-v6_260722-0158.html`
- **Changes (cloud-only):** Closed a rare data-loss edge in the tab-refocus refresh — the `visibilitychange->visible` re-pull guard now also checks `!_retryTimer`, so it won't overwrite local edits still awaiting a failed-push retry (network blip + tab refocus before the backoff retry lands). App footer bumped V3.0->**V3.1** (cloud build only; the offline main build has no cloud adapter, so it needs no change and stays V3.0). node --check on adapter+main pass.

### cloud-v6 — 2026-07-22, 01:58 (Riyadh)
- **Source:** cloud-v5 + Addendum-2 cloud/data-safety remediation (OWNER DECISION: ship with no embedded data).
- **Deployed as:** `cloud-deploy/index.html` (keeper: `aimo-safety-tracker_cloud-v6_2026-07-22-0158.html`)
- **Backup of previous:** `cloud-deploy/backups/index_cloud-v5_260721-2258.html`
- **Changes:**
  - **C3/C1 — all embedded data removed (~91 KB).** KSIA_SEED_PROJECTS, SAMPLE_SEED_PROJECTS, AIMO_OBS_IMPORT_V1 (63 real observations w/ names), their import/seed functions, resetToSampleOnce() and the manual seed button are gone from BOTH builds. View-source has zero real project names / observation text / GACA refs. A fresh install boots to an empty store with a friendly empty state. **This fixes the cloud-data-wipe-on-new-device bug** (resetToSampleOnce no longer overwrites the real cloud row) and the public-data-exposure.
  - **C2 — cross-account safety.** `signOut()` now wipes all synced keys + guard keys + `aimo_recovery_*`/`aimo_projects_pre_reset_*`/`*_corrupt_*` before reload. On login the account id is stored in `aimo_cloud_owner`; if a *different* account logs in on the same browser, local data is cleared (and NOT migrated up) so nothing leaks between accounts.
  - **H1** — sign-out button + `#cloudSyncBadge` in the top bar (revealed when cloud is enabled).
  - **H2** — `push()` serialized (no overlapping uploads), blob re-gathered at send time, re-pull on `visibilitychange→visible`.
  - **H3** — cloud flush on tab close/background (`pagehide` + `visibilitychange→hidden`; app `beforeunload` calls `AIMOCloud.flushNow()`), so an edit made <1s before close reaches the cloud.
  - **H4** — the `?verify` pop-out's edits now reach the cloud: the logged-in main tab pushes on the local child-tab triggers (BroadcastChannel/storage/poll), never on remote hydrates.
  - **H5** — the local session-restore prompt is suppressed when cloud is enabled.
  - **H6** — failed pushes retry with exponential backoff and on `window 'online'`; badge stays red until success.
  - **M/L** — `aimo_general_updates` added to adapter `syncKeys`; Addendum-1 corrupt-recovery key de-dup applied (no more multiplying recovery copies).
- **Not in this build (documented for follow-up):** app-side highs H7–H11 (reconcileRA carrying findings[]/verifier metadata; control-text edit updating linked observation keys; vpAddObsForControl dedupe; vpSaveNow keyed by controlId; _freezeDeckData stripping nested deckData) and the remaining M/L list. These are app-logic changes needing data-model regression tests; they are not cloud-safety blockers.

### cloud-v5 — 2026-07-22, 01:29 (Riyadh)
- **Source:** builder's `aimo-safety-tracker_cloud-v4_popout-photos_UI-amended.html` (interface changes) + one cloud-side adapter fix by me.
- **Deployed as:** `cloud-deploy/index.html` (keeper: `aimo-safety-tracker_cloud-v5_2026-07-22-0129.html`)
- **Backup of previous:** `cloud-deploy/backups/index_cloud-v4_260722.html`
- **Changes:**
  - *(builder, interface)* **Add Photo on the pop-out verification window (`?verify`)** — when a control is evaluated Not Implemented / Not Effective, the raise-a-finding prompt now has an optional Photos area (camera capture, on-device compress, instant thumbnail), reusing the existing `AIMOPhotos` module. Also fixed oversized control text on mobile in Risk Verification.
  - *(me, cloud)* **Made `getToken()` self-sufficient in the `?verify` pop-out.** The pop-out never runs `AIMOCloud.boot()`, so it had no Supabase client and `getToken()` returned null. Added `ensureClient()` (lazily creates the client from CONFIG) and reworked `getToken()`/`getClient()` to use it. supabase-js persists the session in same-origin localStorage, so the pop-out now gets a valid token with no login — photo upload/fetch/delete work directly in the pop-out instead of only via `window.opener`.
- **Data model (additive):** pop-out findings are `stageDocs[sk].observations[]` (`isFinding:true`); photos attach as `observation.photos[]` = `[{id, r2Key, thumbDataUrl, caption, capturedAt, bytes, state}]`. R2 keys: `findings/<projectId>/<obsId>/<photoId>.jpg` (matches the Worker's key rule). Round-trips through Session export/import + Supabase sync.
- **Note for any future base64→R2 migration:** walk `observations[].photos` too, not only `hazards[].findings[].photos`.

### cloud-v4 — 2026-07-22, 00:45 (Riyadh)
- **Backup of previous:** `cloud-deploy/backups/index_cloud-v3_260722.html`
- **Changes:** In-field photo capture → Cloudflare R2 (camera, compress, offline IndexedDB queue, status badges, lazy full-image fetch, delete-from-R2). `WORKER_BASE_URL` = live `aimo-photos` Worker. Thumbnail+reference sync via Supabase; full images in R2.

### cloud-v3 — 2026-07-22, 00:12 (Riyadh)
- **Backup of previous:** `cloud-deploy/backups/index_cloud-v2_260722.html`
- **Changes:** Mobile-responsive build merged with shared-team cloud sync; adapter exposes `getToken()`/`getClient()`.

### cloud-v2 — 2026-07-21, 23:19 (Riyadh)
- **Backup of previous:** `cloud-deploy/backups/index_cloud-v1_260721.html`
- **Changes:** Shared team workspace (`team_state`, invite-only). Needs `cloud/supabase-team-setup.sql` + disabled public sign-ups.

### cloud-v1 — 2026-07-21, ~17:00 (Riyadh)
- **Backup:** `cloud-deploy/backups/index_cloud-v1_260721.html`
- **Changes:** Initial cloud build — Supabase login + localStorage↔Supabase sync. First Cloudflare deploy.

---

*Next entry template:*
```
### cloud-vN — YYYY-MM-DD, HH:MM (Riyadh)
- Source: <what changed>
- Deployed as: cloud-deploy/index.html (keeper: aimo-safety-tracker_cloud-vN_...html)
- Backup of previous: cloud-deploy/backups/index_cloud-v(N-1)_<yymmdd>.html
- Changes: <plain-language summary>
```
