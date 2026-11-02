import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { scryptSync } from 'node:crypto';
import { createReportAccess } from '../server/report-access.mjs';

function setup() {
  const salt = Buffer.alloc(32, 7);
  const middleware = createReportAccess({salt:salt.toString('hex'),hash:scryptSync('test-only-password',salt,64).toString('hex')});
  return async (url, method='GET', body='', cookie='') => {
    const req = Readable.from([Buffer.from(body)]);
    Object.assign(req,{url,method,headers:{host:'localhost:5183',cookie},socket:{remoteAddress:'test'}});
    const result = {status:200,headers:{},body:'',served:false};
    const res = {setHeader:(k,v)=>{result.headers[k]=v;},set statusCode(v){result.status=v;},end:value=>{result.body=value||'';}};
    await middleware(req,res,()=>{result.served=true;});
    return result;
  };
}

test('anonymous requests cannot retrieve pages, print routes, report JSON or source/assets',async()=>{
  const request=setup();
  for (const path of ['/reports/2026-10/overview','/reports/2026-10/print','/src/data/report.json','/assets/report.js','/src/App.tsx','/.report-access.json']) {
    const r=await request(path);assert.equal(r.served,false);assert.equal(r.status,303);assert.equal(r.body,'');assert.equal(r.headers['Cache-Control'],'no-store');
  }
});
test('wrong password stays locked, correct password grants opaque cookie, logout revokes it',async()=>{
  const request=setup();
  assert.equal((await request('/report-login','POST','password=wrong')).status,401);
  const login=await request('/report-login?next=%2Freports%2F2026-10%2Fkeywords','POST','password=test-only-password');
  assert.equal(login.status,303);assert.equal(login.headers.Location,'/reports/2026-10/keywords');
  assert.match(login.headers['Set-Cookie'],/HttpOnly; SameSite=Strict/);
  const cookie=login.headers['Set-Cookie'].split(';')[0];
  assert.equal((await request('/src/data/report.json','GET','',cookie)).served,true);
  await request('/report-logout','POST','',cookie);
  assert.equal((await request('/reports/2026-10/overview','GET','',cookie)).served,false);
});
test('login prevents external redirect and throttles repeated failures',async()=>{
  const request=setup();
  const login=await request('/report-login?next=%2F%2Fevil.example','POST','password=test-only-password');
  assert.equal(login.headers.Location,'/reports/2026-10/overview');
  for(let i=0;i<5;i++)assert.equal((await request('/report-login','POST','password=wrong')).status,401);
  assert.equal((await request('/report-login','POST','password=wrong')).status,429);
});
