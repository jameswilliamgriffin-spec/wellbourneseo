import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../src/data/report.json',import.meta.url),'utf8'));

test('October reporting keeps enquiry counts unavailable and baseline periods explicit',()=>{
  assert.equal(data.meta.month,'2026-10');
  assert.equal(data.meta.enquiries,null);assert.equal(data.meta.currentMetrics.month,'2026-10');
  assert.equal(data.meta.previous,'2026-09');assert.equal(data.meta.sixMonthsAgo,'2026-04');assert.equal(data.meta.nextMonth,'2026-11');
  assert(data.months.every(p=>p.month<'2026-10'));
});
test('monthly headline scopes are separate and CTR reconciles to source totals',()=>{
  assert.equal(data.months.length,6);assert.equal(data.ukMonths.length,15);
  const sept=data.months.at(-1);assert.equal(sept.clicks,619);assert.equal(sept.impressions,192790);assert.equal(sept.sessions,681);
  const uk=data.ukMonths.at(-1);assert.equal(uk.clicks,539);assert.equal(uk.impressions,164367);assert.equal(uk.sessions,null);
  for(const p of [...data.months,...data.ukMonths])assert(Math.abs(p.ctr-p.clicks/p.impressions)<1e-10);
});
test('all 95 original terms survive with unavailable, partial and out-of-top-100 checks distinct',()=>{
  assert.equal(data.keywords.length,95);assert.equal(new Set(data.keywords.map(k=>k.id)).size,95);
  assert.equal(data.keywords.filter(k=>k.status==='branded').length,4);
  assert.equal(data.keywords.filter(k=>k.rankState==='found').length,61);
  assert.equal(data.keywords.filter(k=>k.rankState==='error').length,1);
  assert.equal(data.keywords.filter(k=>k.rankState==='partial').length,2);
  assert.equal(data.keywords.filter(k=>k.rankState==='not-found').length,31);
  for(const k of data.keywords){
    if(k.rankState==='found')assert(k.rank>=1&&k.rank<=100);
    else assert.equal(k.rank,null);
    if(k.rankState==='not-found')assert.equal(k.depth,100);
    assert(k.location);assert(!('previousRank' in k));
  }
});
test('AI report preserves a complete dated baseline and no invented history',()=>{
 assert.equal(data.questions.length,25);assert.equal(data.aiBaseline.results.length,75);
 assert.equal(data.aiBaseline.previousMonth,null);assert.equal(data.aiBaseline.sixMonthsAgo,null);
 assert.equal(data.aiBaseline.baselineDate,'2026-10-27');
});
test('report snapshot keeps source limitations and does not include authentication secrets',()=>{
 assert.equal(data.octoberRefresh.current.clicks,637);assert.equal(data.octoberRefresh.current.impressions,145898);assert.equal(data.octoberRefresh.current.sessions,571);
 assert(data.backlinks.previousMonth===null);assert(data.sources.some(s=>s.id==='october-refresh'));
 const raw=JSON.stringify(data);assert(!/GOCSPX-|refresh_token|client_secret|sessionSecret/.test(raw));
});
