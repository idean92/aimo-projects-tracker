# A build/deploy process for single-agent-owned projects

This is the process developed on the AIMO Safety Tracker, generalized so it
can be dropped into other projects. It covers two things: the *principles*
(why the process is shaped this way) and a *template* `CLAUDE.md` you can
copy into a new repo and fill in.

---

## The core principles

1. **One session, two jobs.** The same session both edits the code and
   pushes to `main` — no separate "build" and "publish" hand-off. Since
   hosting is wired directly to the GitHub repo (Cloudflare, Vercel, Netlify,
   etc. all support this), a push *is* a deploy. Nothing extra to trigger.

2. **Hard rule: explicit approval, every time.** No version is built,
   changed, or deployed without the owner explicitly saying so *in that
   instance*. A backlog item being "next up," a prior approval on a similar
   change, or general momentum never counts as authorization. This is the
   single most important rule — it's what prevents an agent from
   "helpfully" shipping something unasked.

3. **Two separate green lights.** Approving a plan ≠ approving the deploy.
   "Yes, build that" and "yes, ship that" are distinct instructions, even if
   they happen back to back.

4. **Feedback has a funnel, not a direct line.** The pipeline has four
   distinct stages, and each one is a separate actor/decision point —
   feedback never skips a stage on its way to becoming code:

   1. **Capture** — an in-app "Send feedback" button (floating, on every
      screen) opens a small form: comment + optional screenshot. It POSTs
      to a lightweight endpoint (a Worker/Function, not a database write
      from the client) along with context — app version, which
      screen/tab it was raised from.
   2. **Store** — that endpoint writes the submission into a Notion
      database (a "Feedback Inbox") as a new row/page. This is the single
      landing zone for all raw feedback — nothing is triaged or acted on
      yet at this point, it's just captured.
   3. **Triage → plan** — on a recurring pass, the agent reviews what's new
      in the Feedback Inbox, consolidates it into a pending-changes list
      (grouped bugs vs. improvements), and for each item **writes an
      implementation plan** — what will change, which files/logic, risk
      level. This triage output is mirrored into the repo
      (`PENDING_CHANGES.md`) *and* a Notion page, so both the owner and any
      future session see the same queue.
   4. **Approve → implement → approve → deploy** — the owner reviews the
      proposed plan and approves it before any code is touched. Once
      implemented, it still isn't deployed until a *separate* explicit
      "ship it" — matching principle #3.

   The key property: the agent never jumps straight from "user complained
   about X" to "here's a code fix." There's always a written plan in
   between that the owner signs off on first.

5. **Review scales with risk, not with every change.** A second-opinion
   review (a separate, stronger-model agent) is triggered only for major
   version bumps or changes touching sensitive logic (auth, data writes,
   destructive ops) — not for every patch. Minor/copy/style changes skip
   it. This keeps the safety net where it matters without adding friction
   everywhere.

6. **Every change is logged, in two places with different jobs.** A
   changelog (what shipped, when) and a pending-changes list (what's
   proposed/queued, with its plan) — both checked into the repo so history
   survives regardless of which session or agent touches it next.

7. **The mechanism is pre-authorized; the decision isn't.** It's fine to
   standingly authorize *how* changes ship (e.g. direct push to `main`, no
   PR needed) without that being authorization for *whether/when* a given
   change ships. Keep those two questions separate.

---

## Template `CLAUDE.md`

Copy this into a new project's `CLAUDE.md` and fill in the brackets. Any
Claude Code session on that repo picks up the same discipline automatically
— no need to re-explain it each time.

```markdown
# [Project Name] — Working Notes

## What this is
[One-paragraph description: what the app is, key files, back-end services.]

## Deployment
- Hosting: [Cloudflare/Vercel/Netlify/etc.], wired directly to this repo's
  Git integration — [no CI workflow needed / describe if there is one].
- Deploying is: land a commit on `main`. Nothing else to trigger.

## Hard rule: no version changes or deploys without explicit approval
No new version of the app is built, updated, or deployed unless the owner has
explicitly said to do so, in that specific instance. This overrides any other
signal — a backlog item, a "next in sequence" version, or momentum from a
prior task are never sufficient alone.
- Do not edit code to implement a change until the owner has approved that
  specific change.
- Do not commit/push a version bump until explicitly told to deploy it —
  even if already implemented. Approval-to-implement and approval-to-deploy
  are separate green lights.
- If in doubt, ask.

## Git workflow
- Direct pushes to `main` are pre-authorized as the *mechanism* (how), not as
  standing permission for *whether/when* a push happens — the hard rule above
  still governs that.
- Destructive git ops (force-push, history rewrite, branch deletion) require
  explicit confirmation, always.

## Feedback review process (Notion)
Requested changes are sourced from in-app feedback (the floating "Send
feedback" button) and land in a Notion **Feedback Inbox** database via a
feedback-capture endpoint (comment + optional screenshot, tagged with app
version + screen context). The standing process:

1. New feedback is triaged and consolidated into `PENDING_CHANGES.md`
   (mirrored to a Notion "Pending Changes (awaiting approval)" page),
   grouped as 🐛 Bugs and ✨ Improvements.
2. For each item, propose an implementation plan (what will change,
   files/logic touched, risk level) before writing any code.
3. The owner reviews and explicitly approves the plan. Nothing is
   implemented before that approval.
4. Once implemented, the change still is not deployed until the owner gives
   a separate, explicit instruction to deploy.
5. Update `PENDING_CHANGES.md` and `CHANGELOG.md` to reflect what shipped,
   as part of the same deploy.

## Code review before deploying
Spawn a review subagent on a stronger model before pushing when:
- Major version bump (left-most version number changes).
- Change touches sensitive logic: auth, data reads/writes, destructive ops.
- It feels architecturally significant or risky, even if it's technically
  minor.
Skip review for minor/patch bumps, styling, copy edits, small isolated
fixes.

## Versioning rules
- Every change recorded in `CHANGELOG.md` (newest at top). No ship without
  an entry.
- Version X.Y: minor change → bump Y. Major (data-model/behavior/removal) →
  roll X, reset Y.
- Version string in code must stay in sync with the latest changelog entry.
- Never require users to wipe local storage/data to adopt a new version.
```
