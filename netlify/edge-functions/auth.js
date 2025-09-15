// Password-only gate using Edge Functions.
// Usage: set SITE_PASSWORD in Netlify Environment Variables. No username is required.
// The gate sets an HttpOnly cookie with a hash of the password and allows subsequent requests.

const COOKIE_NAME = 'pw_auth';
const TTL = Number(Deno.env.get('PW_TTL_SECONDS') || '30'); // default 30s; set 0 for one-time per request
const COOKIE_MAX_AGE = Math.max(0, Math.floor(TTL));
const SHOW_HINT = (Deno.env.get('SHOW_PASSWORD_HINT') || '').toLowerCase() === 'true' || (Deno.env.get('NETLIFY_DEV') || '').toLowerCase() === 'true';

function parseCookies(req) {
  const header = req.headers.get('cookie') || '';
  return Object.fromEntries(
    header.split(';').map(v => v.trim()).filter(Boolean).map(v => {
      const idx = v.indexOf('=');
      if (idx === -1) return [v, ''];
      return [decodeURIComponent(v.slice(0, idx)), decodeURIComponent(v.slice(idx + 1))];
    })
  );
}

async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function passwordPage(returnTo, message = '', hint = '') {
  const content = `<!doctype html>
  <html lang="en"><head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Protected</title>
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b0b;color:#fff;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica,Arial}
    .card{width:min(92vw,420px);background:#111;box-shadow:0 20px 60px rgba(0,0,0,.6);border:1px solid rgba(255,99,71,.15);border-radius:14px;padding:28px}
    h1{margin:0 0 8px;font-size:22px;letter-spacing:.5px;color:#ff8a50}
    p{margin:0 0 18px;color:#aaa}
    form{display:flex;gap:8px}
    input[type=password]{flex:1;padding:12px 14px;border-radius:10px;border:1px solid rgba(255,99,71,.35);background:#0d0d0d;color:#fff;outline:none}
    button{padding:12px 16px;border-radius:10px;border:1px solid rgba(255,99,71,.5);background:linear-gradient(135deg,#ff7a3d,#ff5330);color:#fff;cursor:pointer}
    .msg{color:#ffb4a2;font-size:13px;margin-bottom:8px;min-height:18px}
    .hint{color:#8bdc9b;font-size:12px;margin:6px 0 12px;opacity:0.9}
  </style></head>
  <body><div class="card">
    <h1>Enter Password</h1>
    <div class="msg">${message}</div>
    ${hint ? `<div class="hint">Write this to unlock: <b>${hint}</b></div>` : ''}
    <form method="POST" action="/__auth">
      <input type="hidden" name="return" value="${returnTo}" />
      <input type="password" name="password" placeholder="Password" autofocus required />
      <button type="submit">Enter</button>
    </form>
  </div></body></html>`;
  return new Response(content, { status: 401, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

export default async (request, context) => {
  const SITE_PASSWORD = Deno.env.get('SITE_PASSWORD');
  if (!SITE_PASSWORD) {
    // If no password configured, allow access (useful for local dev)
    return context.next();
  }

  const url = new URL(request.url);
  const cookies = parseCookies(request);
  const expected = await sha256Hex(SITE_PASSWORD);
  const hintText = SHOW_HINT ? SITE_PASSWORD : '';

  // Handle login POST
  if (url.pathname === '/__auth' && request.method === 'POST') {
    try {
      const form = await request.formData();
      const pass = form.get('password') || '';
      const ret = (form.get('return') || '/') + '';
      const ok = (pass + '') === SITE_PASSWORD;
      if (ok) {
        const headers = new Headers({ Location: ret });
        headers.append('Set-Cookie', `${COOKIE_NAME}=${expected}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`);
        return new Response(null, { status: 302, headers });
      }
      return passwordPage(ret, 'Incorrect password', hintText);
    } catch (_) {
      return passwordPage('/', '', hintText);
    }
  }

  // If already authenticated via cookie
  if (cookies[COOKIE_NAME] === expected) {
    if (COOKIE_MAX_AGE <= 0) {
      // one-time: allow once, then clear so refresh asks again
      const response = await context.next();
      response.headers.append('Set-Cookie', `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
      return response;
    }
    // short TTL: allow assets to load for TTL seconds; refresh after TTL prompts again
    return context.next();
  }

  // Show password page (return to original path)
  return passwordPage(url.pathname + url.search, '', hintText);
};
