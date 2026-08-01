// Cloudflare Access JWT verification — the ONLY source of user identity for
// per-user D1 routes. No route handler ever reads a user id from a request
// body or query param; `requireAccessIdentity()` is the single choke point
// where a request turns into a trusted identity, and every per-user D1
// query must be parameterized with the value it returns.
//
// Requires two Worker vars (set after creating a Cloudflare Access
// Application in the dashboard — see docs/D1-TRIAL.md):
//   CF_ACCESS_TEAM_DOMAIN  e.g. "ideandaai.cloudflareaccess.com"
//   CF_ACCESS_AUD          the Application Audience (AUD) tag

let jwksCache = null; // { keys, fetchedAt }
const JWKS_TTL_MS = 60 * 60 * 1000; // 1 hour

async function getJWKS(teamDomain) {
  const now = Date.now();
  if (jwksCache && now - jwksCache.fetchedAt < JWKS_TTL_MS) return jwksCache.keys;
  const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`Failed to fetch Access JWKS: ${res.status}`);
  const { keys } = await res.json();
  jwksCache = { keys, fetchedAt: now };
  return keys;
}

function base64urlToUint8Array(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(b64url.length + (4 - (b64url.length % 4)) % 4, '=');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function base64urlDecodeJSON(b64url) {
  return JSON.parse(new TextDecoder().decode(base64urlToUint8Array(b64url)));
}

/**
 * Verifies a Cloudflare Access JWT end-to-end: signature (against the
 * team's JWKS), expiry, and audience. Returns the decoded payload only if
 * every check passes; throws otherwise. This function does not trust
 * anything from the request except the JWT string itself.
 */
export async function verifyAccessJWT(jwt, { teamDomain, aud, jwks }) {
  const parts = jwt.split('.');
  if (parts.length !== 3) throw new Error('Malformed JWT');
  const [headerB64, payloadB64, sigB64] = parts;

  const header = base64urlDecodeJSON(headerB64);
  if (header.alg !== 'RS256') throw new Error(`Unsupported alg: ${header.alg}`);

  const keys = jwks || (await getJWKS(teamDomain));
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('No matching JWKS key for kid');

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64urlToUint8Array(sigB64);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, signedData);
  if (!valid) throw new Error('Signature verification failed');

  const payload = base64urlDecodeJSON(payloadB64);
  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && payload.exp < nowSec) throw new Error('Token expired');
  if (typeof payload.nbf === 'number' && payload.nbf > nowSec) throw new Error('Token not yet valid');
  if (aud && !(Array.isArray(payload.aud) ? payload.aud.includes(aud) : payload.aud === aud)) {
    throw new Error('Audience mismatch');
  }

  return payload;
}

/**
 * Extracts and verifies the caller's identity from the
 * Cf-Access-Jwt-Assertion header Cloudflare Access adds to requests that
 * pass its policy check. Returns { email, sub }. Throws on any failure —
 * callers must treat a thrown error as "reject the request," never fall
 * back to a default identity.
 */
export async function requireAccessIdentity(request, env) {
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!jwt) throw new Error('Missing Cf-Access-Jwt-Assertion header');
  if (!env.CF_ACCESS_TEAM_DOMAIN || !env.CF_ACCESS_AUD) {
    throw new Error('Cloudflare Access is not configured (CF_ACCESS_TEAM_DOMAIN/CF_ACCESS_AUD missing)');
  }
  const payload = await verifyAccessJWT(jwt, {
    teamDomain: env.CF_ACCESS_TEAM_DOMAIN,
    aud: env.CF_ACCESS_AUD,
  });
  if (!payload.email) throw new Error('Verified token has no email claim');
  return { email: payload.email, sub: payload.sub };
}
