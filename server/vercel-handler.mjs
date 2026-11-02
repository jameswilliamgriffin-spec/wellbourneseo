import {readFile, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve, sep, extname} from 'node:path';
import {createReportAccess} from './report-access.mjs';

const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.csv':'text/csv; charset=utf-8','.md':'text/markdown; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
export function createHandler({config, root = fileURLToPath(new URL('./private/', import.meta.url)), secureCookies = true} = {}) {
  let gate;
  try {
    const parsed = JSON.parse(config || process.env.REPORT_ACCESS_CONFIG || 'null');
    if (!parsed || !/^[a-f0-9]{64,}$/.test(parsed.sessionSecret || '')) throw new Error();
    gate = createReportAccess(parsed, {sessionSecret:parsed.sessionSecret,secureCookies});
  } catch { /* Fail closed: no report assets are exposed without configuration. */ }
  return async (req, res) => {
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('X-Frame-Options','DENY');
    if (!gate) {res.statusCode=503;return res.end('Report access is not configured. Please contact the report administrator.');}
    try {
      await gate(req,res,async()=>{
        if (!['GET','HEAD'].includes(req.method)) {res.statusCode=405;return res.end();}
        const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        // Only compiled assets and named report routes are served, never repository source.
        const spa = pathname==='/' || /^\/reports(?:\/[a-zA-Z0-9-]+)*\/?$/.test(pathname);
        const allowed = /^\/(assets|brand|fonts|downloads)\/[^\0]+$/.test(pathname);
        if (!spa && !allowed) {res.statusCode=404;return res.end('Not found');}
        const file = resolve(root, spa ? 'index.html' : '.'+pathname);
        if (!file.startsWith(resolve(root)+sep)) {res.statusCode=404;return res.end('Not found');}
        let body;
        try {if (!(await stat(file)).isFile()) throw new Error();body=await readFile(file);} catch {res.statusCode=404;return res.end('Not found');}
        res.setHeader('Content-Type',types[extname(file)] || 'application/octet-stream');
        res.end(req.method==='HEAD'?undefined:body);
      });
    } catch {if (!res.headersSent) res.statusCode=400;res.end('Unable to process request');}
  };
}
export default createHandler();
