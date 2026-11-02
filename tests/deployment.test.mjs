import test from 'node:test';
import assert from 'node:assert/strict';
import {scryptSync,createHmac} from 'node:crypto';
import {mkdtemp,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Readable} from 'node:stream';
import {createHandler} from '../server/vercel-handler.mjs';

const salt=Buffer.alloc(32,3);
const settings={salt:salt.toString('hex'),hash:scryptSync('deployment-test-password',salt,64).toString('hex'),sessionSecret:'ab'.repeat(32)};
async function request(handler,url,{body,cookie='',method=body===undefined?'GET':'POST'}={}) {
 const req=Readable.from(body===undefined?[]:[Buffer.from(body)]);
 Object.assign(req,{url,method,headers:{host:'report.example',cookie},socket:{remoteAddress:'test'}});
 const r={status:200,headers:{},body:''};
 const res={set statusCode(v){r.status=v;},get headersSent(){return false;},setHeader(k,v){r.headers[k]=v;},end(v){r.body=v?.toString()||'';}};
 await handler(req,res);return r;
}
test('serverless deployment fails closed without private environment configuration',async()=>{
 const r=await request(createHandler({config:'{}'}),'/reports/2026-10/overview');assert.equal(r.status,503);assert(!r.body.includes('637'));
});
test('serverless sessions survive cold starts; every asset is protected and private paths remain inaccessible',async()=>{
 const root=await mkdtemp(join(tmpdir(),'wellbourne-access-'));
 try {
  await mkdir(join(root,'assets'));await writeFile(join(root,'index.html'),'<h1>Protected report</h1>');await writeFile(join(root,'assets','report.js'),'protected data');
  const make=()=>createHandler({config:JSON.stringify(settings),root});
  for(const path of ['/','/reports/2026-10/overview','/reports/2026-10/print','/assets/report.js','/downloads/data.csv'])assert.equal((await request(make(),path)).status,303);
  const login=await request(make(),'/report-login?next=%2Freports%2F2026-10%2Foverview',{body:'password=deployment-test-password'});
  assert.equal(login.status,303);assert.match(login.headers['Set-Cookie'],/Secure/);
  const cookie=login.headers['Set-Cookie'].split(';')[0];
  assert.match((await request(make(),'/reports/2026-10/overview',{cookie})).body,/Protected report/);
  assert.equal((await request(make(),'/assets/report.js',{cookie})).body,'protected data');
  assert.equal((await request(make(),'/src/data/report.json',{cookie})).status,404);
  assert.equal((await request(make(),'/.report-access.json',{cookie})).status,404);
  assert.equal((await request(make(),'/assets/%2e%2e/%2e%2e/server/report-access.mjs',{cookie})).status,404);
  const logout=await request(make(),'/report-logout',{cookie});assert.match(logout.headers['Set-Cookie'],/Max-Age=0/);
  const tampered=cookie.slice(0,-1)+(cookie.endsWith('a')?'b':'a');assert.equal((await request(make(),'/assets/report.js',{cookie:tampered})).status,303);
  const payload='cd'.repeat(32)+'.'+(Date.now()-1000);const expired=payload+'.'+createHmac('sha256',settings.sessionSecret).update(payload).digest('hex');
  assert.equal((await request(make(),'/assets/report.js',{cookie:'wellbourne_report_session='+expired})).status,303);
 } finally {await rm(root,{recursive:true,force:true});}
});
