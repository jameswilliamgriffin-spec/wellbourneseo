import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';

const COOKIE = 'wellbourne_report_session';
const escapeHtml = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safePath = value => typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !/[\\\r\n]/.test(value) && !value.startsWith('/report-') ? value : '/reports/2026-10/overview';

export function createReportAccess(credential, {sessionSecret, secureCookies = false} = {}) {
  const salt = Buffer.from(credential.salt, 'hex');
  const expected = Buffer.from(credential.hash, 'hex');
  if (salt.length !== 32 || expected.length !== 64) throw new Error('Invalid report access configuration');
  const sessions = new Map(), failures = new Map();
  const sign = value => createHmac('sha256', sessionSecret).update(value).digest('hex');
  const validSignedSession = token => {
    if (!token || token.length > 300) return false;
    const [nonce, expiry, signature, extra] = token.split('.');
    if (extra || !/^[a-f0-9]{64}$/.test(nonce || '') || !/^\d+$/.test(expiry || '') || !/^[a-f0-9]{64}$/.test(signature || '')) return false;
    const expires = Number(expiry);
    return expires > Date.now() && expires <= Date.now()+8*60*60*1000 && timingSafeEqual(Buffer.from(sign(`${nonce}.${expiry}`),'hex'), Buffer.from(signature,'hex'));
  };
  return async (req, res, next) => {
    const setHeader = res.setHeader.bind(res);
    res.setHeader = (name, value) => setHeader(name, name.toLowerCase() === 'cache-control' ? 'no-store' : value);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    const url = new URL(req.url, 'http://localhost');
    const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=')));
    const token = cookies[COOKIE];
    const now = Date.now();
    for (const [key, expires] of sessions) if (expires < now) sessions.delete(key);
    for (const [key, value] of failures) if (value.until < now) failures.delete(key);
    const authenticated = sessionSecret ? validSignedSession(token) : sessions.has(token);
    const secure = secureCookies || req.socket.encrypted;
    const cookieFlags = `Path=/; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}`;
    const redirect = path => {res.statusCode = 303; res.setHeader('Location', path); res.end();};
    if (url.pathname === '/report-logout' && ['POST','GET'].includes(req.method)) {
      sessions.delete(token); res.setHeader('Clear-Site-Data', '"cache"'); res.setHeader('Set-Cookie', `${COOKIE}=; ${cookieFlags}; Max-Age=0`); return redirect('/report-login');
    }
    if (url.pathname !== '/report-login') {
      if (authenticated) return next();
      return redirect('/report-login?next=' + encodeURIComponent(safePath(req.url)));
    }
    res.setHeader('Clear-Site-Data', '"cache"');
    const target = safePath(url.searchParams.get('next'));
    if (authenticated) return redirect(target);
    let error = '';
    if (req.method === 'POST') {
      const origin = req.headers.origin;
      if (origin && origin !== `${secure ? 'https' : 'http'}://${req.headers.host}`) {res.statusCode=403; return res.end('Request refused');}
      const address = secureCookies ? req.headers['x-forwarded-for'] || req.socket.remoteAddress : req.socket.remoteAddress;
      const attempt = failures.get(address) || {count:0, until: now + 60000};
      if (attempt.count >= 5) {res.statusCode=429; res.setHeader('Retry-After','60'); error='Too many attempts. Please wait a minute and try again.';}
      else {
        let body = '';
        for await (const chunk of req) {body += chunk; if (Buffer.byteLength(body)>2048) {res.statusCode=413; return res.end('Request too large');}}
        const entered = new URLSearchParams(body).get('password') || '';
        if (timingSafeEqual(scryptSync(entered, salt, 64), expected)) {
          let session = randomBytes(32).toString('hex');
          if (sessionSecret) { const payload = `${session}.${now+8*60*60*1000}`; session = `${payload}.${sign(payload)}`; }
          else sessions.set(session, now + 8*60*60*1000);
          failures.delete(address);
          res.setHeader('Set-Cookie', `${COOKIE}=${session}; ${cookieFlags}`);
          return redirect(target);
        }
        attempt.count++; failures.set(address, attempt); res.statusCode=401; error='That password is incorrect. Please try again.';
      }
    } else if (req.method !== 'GET' && req.method !== 'HEAD') {res.statusCode=405; return res.end();}
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
    res.end(`<!doctype html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Report access · The Wellbourne Clinic</title><style>*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;padding:24px;background:#f4f3ed;color:#193b30;font:17px/1.6 system-ui,sans-serif}main{width:100%;max-width:440px;background:#fff;padding:36px;border:1px solid #dce2d9;border-radius:24px}h1{font-size:30px;line-height:1.2;letter-spacing:-1px;margin:24px 0 12px}p{color:#596a60}.brand{font-weight:650;font-size:17px}label{display:block;font-weight:600;margin-top:24px}input,button{width:100%;font:inherit;border-radius:12px;padding:12px 15px}input{border:1px solid #9aa99f;margin:8px 0 18px}button{background:#193b30;color:white;border:0;cursor:pointer;font-weight:600}:focus-visible{outline:3px solid #c4d68b;outline-offset:3px}.error{color:#a52e22;font-size:15px}</style><main><div class="brand">The Wellbourne Clinic</div><h1>Monthly SEO report</h1><p>Enter the report password to continue.</p>${error?`<p class="error" role="alert">${error}</p>`:''}<form method="post" action="/report-login?next=${escapeHtml(encodeURIComponent(target))}"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required autofocus><button type="submit">Open report</button></form></main></html>`);
  };
}

export default function reportAccess() {
  const install = server => { server.middlewares.use(createReportAccess(JSON.parse(readFileSync(new URL('../.report-access.json', import.meta.url), 'utf8')))); };
  return {name:'wellbourne-report-access', configureServer:install, configurePreviewServer:install};
}
