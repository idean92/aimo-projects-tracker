// AIMO Tracker Worker: serves the static app and handles:
//   POST /api/feedback     -> files submissions into the Notion "Feedback
//                             Inbox" database (see docs/NOTION.md).
//   GET/PUT /api/team-state -> D1-backed shared team blob (any authenticated
//                              Cloudflare Access user; see docs/D1-TRIAL.md).
//   GET/PUT /api/app-state  -> D1-backed per-user blob, scoped strictly by
//                              the verified Access identity (see src/access.js
//                              and docs/D1-TRIAL.md for the trust boundary).
// See docs/CLOUDFLARE.md for the required environment variables/secrets.

import { requireAccessIdentity } from './access.js';

const MAX_COMMENT_LEN = 2000;
const MAX_CONTEXT_LEN = 300;
const MAX_SCREENSHOT_BYTES = 3 * 1024 * 1024; // ~3MB decoded, generous for a resized JPEG

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/feedback') {
      if (request.method !== 'POST') {
        return json({ error: 'Method not allowed' }, 405);
      }
      return handleFeedback(request, env);
    }
    if (url.pathname === '/api/team-state') {
      return handleTeamState(request, env);
    }
    if (url.pathname === '/api/app-state') {
      return handleAppState(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

async function handleFeedback(request, env) {
  if (!env.NOTION_API_KEY || !env.NOTION_FEEDBACK_DATABASE_ID) {
    return json({ error: 'Feedback service is not configured yet' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, MAX_COMMENT_LEN) : '';
  const context = typeof body.context === 'string' ? body.context.slice(0, MAX_CONTEXT_LEN) : '';
  const screenshot = typeof body.screenshot === 'string' ? body.screenshot : null;

  if (!comment) {
    return json({ error: 'Missing comment' }, 400);
  }
  if (screenshot && screenshot.length > MAX_SCREENSHOT_BYTES * 1.4) {
    // base64 is ~1.37x the decoded size; reject oversized payloads outright
    return json({ error: 'Screenshot too large' }, 413);
  }

  const properties = {
    Feedback: { title: [{ text: { content: comment.slice(0, 200) } }] },
    Comment: { rich_text: [{ text: { content: comment } }] },
    Context: { rich_text: [{ text: { content: context } }] },
    Status: { select: { name: 'New' } },
  };

  let notionRes;
  try {
    notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: env.NOTION_FEEDBACK_DATABASE_ID },
        properties,
      }),
    });
  } catch {
    return json({ error: 'Could not reach Notion' }, 502);
  }

  if (!notionRes.ok) {
    return json({ error: 'Notion rejected the submission' }, 502);
  }

  const page = await notionRes.json();

  // Screenshots aren't uploaded inline here — Notion's API doesn't accept raw
  // base64 image data on a page property. If a screenshot was attached, note
  // it in a comment on the new page so triage knows to ask for it; uploading
  // it to Notion's file-upload API is a possible follow-up, not built yet.
  if (screenshot) {
    try {
      await fetch(`https://api.notion.com/v1/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent: { page_id: page.id },
          rich_text: [{ text: { content: 'A screenshot was attached to this submission but is not yet auto-uploaded — ask the submitter if needed.' } }],
        }),
      });
    } catch {
      // Non-fatal: the feedback itself already landed.
    }
  }

  return json({ ok: true });
}

// Shared team blob (D1 equivalent of the Supabase team_state table / the
// "any authenticated user, single shared row" RLS policy). No per-row
// scoping needed -- every valid Access identity gets the same row.
async function handleTeamState(request, env) {
  let identity;
  try {
    identity = await requireAccessIdentity(request, env);
  } catch (err) {
    return json({ error: 'Unauthorized', detail: err.message }, 401);
  }

  const id = 'default';
  if (request.method === 'GET') {
    const row = await env.DB.prepare('SELECT data, updated_at, updated_by FROM team_state WHERE id = ?').bind(id).first();
    return json(row || { data: '{}', updated_at: null, updated_by: null });
  }
  if (request.method === 'PUT') {
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
    const data = typeof body.data === 'string' ? body.data : JSON.stringify(body.data ?? {});
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO team_state (id, data, updated_at, updated_by) VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, updated_by = excluded.updated_by`
    ).bind(id, data, now, identity.email).run();
    return json({ ok: true, updated_at: now });
  }
  return json({ error: 'Method not allowed' }, 405);
}

// Per-user blob (D1 equivalent of the Supabase app_state table / the
// `auth.uid() = user_id` RLS policy). CRITICAL TRUST BOUNDARY: `userId`
// below is the ONLY identifier ever used to read or write this table, and
// it comes exclusively from requireAccessIdentity()'s verified JWT claim --
// never from `body`, never from a query/path param. There is no code path
// in this function that reads a client-supplied user id, so there is no
// "forgot the WHERE clause" failure mode to guard against: the value that
// would need to be forgotten is never accepted as input in the first place.
async function handleAppState(request, env) {
  let identity;
  try {
    identity = await requireAccessIdentity(request, env);
  } catch (err) {
    return json({ error: 'Unauthorized', detail: err.message }, 401);
  }
  const userId = identity.email;

  if (request.method === 'GET') {
    const row = await env.DB.prepare('SELECT data, updated_at FROM app_state WHERE user_id = ?').bind(userId).first();
    return json(row || { data: '{}', updated_at: null });
  }
  if (request.method === 'PUT') {
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
    const data = typeof body.data === 'string' ? body.data : JSON.stringify(body.data ?? {});
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO app_state (user_id, data, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
    ).bind(userId, data, now).run();
    return json({ ok: true, updated_at: now });
  }
  return json({ error: 'Method not allowed' }, 405);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
