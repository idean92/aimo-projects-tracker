// Standalone test of src/access.js's verifyAccessJWT against real signed
// JWTs (generated here, not fetched from Cloudflare) so we can exercise the
// signature/claims logic without a live Access deployment.
import { verifyAccessJWT } from '../src/access.js';

const AUD = 'test-aud-tag';
const TEAM = 'example.cloudflareaccess.com';

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function makeKeypair() {
  return crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify']
  );
}

async function signJWT(privateKey, kid, payload) {
  const header = { alg: 'RS256', typ: 'JWT', kid };
  const headerB64 = b64url(JSON.stringify(header));
  const payloadB64 = b64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(signingInput));
  return `${signingInput}.${b64url(sig)}`;
}

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { console.log(`PASS: ${name}`); pass++; }
  else { console.log(`FAIL: ${name}`); fail++; }
}

const { publicKey, privateKey } = await makeKeypair();
const jwk = await crypto.subtle.exportKey('jwk', publicKey);
jwk.kid = 'test-key-1';
const jwks = [jwk];

const now = Math.floor(Date.now() / 1000);

// 1. Valid token for user A
const jwtA = await signJWT(privateKey, 'test-key-1', { email: 'usera@example.com', sub: 'sub-a', aud: AUD, exp: now + 3600, iat: now });
const payloadA = await verifyAccessJWT(jwtA, { teamDomain: TEAM, aud: AUD, jwks });
check('valid JWT for user A verifies and returns correct email', payloadA.email === 'usera@example.com');

// 2. Valid token for user B, different email
const jwtB = await signJWT(privateKey, 'test-key-1', { email: 'userb@example.com', sub: 'sub-b', aud: AUD, exp: now + 3600, iat: now });
const payloadB = await verifyAccessJWT(jwtB, { teamDomain: TEAM, aud: AUD, jwks });
check('valid JWT for user B verifies and returns correct (different) email', payloadB.email === 'userb@example.com' && payloadB.email !== payloadA.email);

// 3. Tampered token: take A's valid JWT, splice in B's email into the payload without re-signing
{
  const [h, p, s] = jwtA.split('.');
  const decoded = JSON.parse(Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
  decoded.email = 'attacker-forged@example.com';
  const forgedPayloadB64 = b64url(JSON.stringify(decoded));
  const forgedJWT = `${h}.${forgedPayloadB64}.${s}`; // old signature, new payload
  let threw = false;
  try { await verifyAccessJWT(forgedJWT, { teamDomain: TEAM, aud: AUD, jwks }); }
  catch { threw = true; }
  check('tampered payload (signature no longer matches) is rejected', threw);
}

// 4. Expired token
{
  const expiredJWT = await signJWT(privateKey, 'test-key-1', { email: 'usera@example.com', sub: 'sub-a', aud: AUD, exp: now - 10, iat: now - 3600 });
  let threw = false;
  try { await verifyAccessJWT(expiredJWT, { teamDomain: TEAM, aud: AUD, jwks }); }
  catch { threw = true; }
  check('expired token is rejected', threw);
}

// 5. Wrong audience
{
  const wrongAudJWT = await signJWT(privateKey, 'test-key-1', { email: 'usera@example.com', sub: 'sub-a', aud: 'some-other-app', exp: now + 3600, iat: now });
  let threw = false;
  try { await verifyAccessJWT(wrongAudJWT, { teamDomain: TEAM, aud: AUD, jwks }); }
  catch { threw = true; }
  check('wrong-audience token is rejected', threw);
}

// 6. Unknown kid (key not in JWKS - e.g. rotated out, or attacker's own key)
{
  const { privateKey: otherPriv } = await makeKeypair();
  const unknownKidJWT = await signJWT(otherPriv, 'not-in-jwks', { email: 'usera@example.com', aud: AUD, exp: now + 3600, iat: now });
  let threw = false;
  try { await verifyAccessJWT(unknownKidJWT, { teamDomain: TEAM, aud: AUD, jwks }); }
  catch { threw = true; }
  check('token signed with a key not in the JWKS is rejected', threw);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
