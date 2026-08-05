// AIMO Tracker Worker: serves the static app and handles POST /api/feedback,
// filing submissions into the Notion "Feedback Inbox" database (see
// docs/NOTION.md for its schema/IDs). See docs/CLOUDFLARE.md for the
// required environment variables/secrets this needs to actually work.

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
    return env.ASSETS.fetch(request);
  },
};

async function handleFeedback(request, env) {
  if (!env.NOTION_API_KEY || !env.NOTION_FEEDBACK_DATABASE_ID) {
    return json({ error: 'Feedback service is not configured yet' }, 503);
  }

  // L3: reject oversized/wrong-typed bodies before buffering and parsing them, not after.
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return json({ error: 'Content-Type must be application/json' }, 415);
  }
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_SCREENSHOT_BYTES * 1.5) {
    return json({ error: 'Request too large' }, 413);
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

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
