import saved from './data/report.json';

export const report = saved;
export type Work = typeof saved.work[number];
export type Keyword = typeof saved.keywords[number];
export type Question = typeof saved.questions[number];
export type Issue = typeof saved.issues[number];
export type Task = typeof saved.plan[number];
export type SearchPage = typeof saved.pages[number];
export type Query = typeof saved.queries[number];
export type Metric = 'clicks' | 'impressions' | 'sessions' | 'position' | 'ctr';
export type MonthPoint = {month:string; clicks:number; impressions:number; ctr:number; position:number; sessions:number|null};
export type SourceScope = 'all' | 'uk';

export const MEASURES: Record<Metric,{label:string; short:string; description:string}> = {
  impressions:{label:'Search appearances',short:'Appearances',description:'Times Google showed the website in its web search results.'},
  clicks:{label:'Clicks from Google',short:'Clicks',description:'Times someone clicked through from Google’s web search results.'},
  sessions:{label:'Google organic visits',short:'Visits',description:'Recorded website sessions from google / organic in Analytics.'},
  position:{label:'Average search position',short:'Position',description:'Search Console’s observed average across impressions. Lower is better; this is not a fixed rank.'},
  ctr:{label:'Search click rate',short:'Click rate',description:'Clicks divided by appearances. Query mix and position affect this figure.'},
};

export const num=(v:number|null|undefined,digits=0)=>v==null?'—':v.toLocaleString('en-GB',{maximumFractionDigits:digits});
export const pct=(v:number|null|undefined,digits=1)=>v==null?'—':`${(v*100).toFixed(digits)}%`;
export const metricFormat=(v:number|null|undefined,key:Metric)=>key==='ctr'?pct(v,2):num(v,key==='position'?1:0);
export const monthLabel=(s:string,short=false)=>new Date(`${s}-15T12:00:00Z`).toLocaleDateString('en-GB',{month:short?'short':'long',year:short?undefined:'numeric',timeZone:'UTC'});
export const dayLabel=(s:string)=>new Date(`${s.slice(0,10)}T12:00:00Z`).toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'});
export const pathOf=(s:string)=>{try{return new URL(s).pathname;}catch{return s;}};
export const change=(now:number|null|undefined,before:number|null|undefined)=>{
  if(now==null||before==null)return {text:'Not comparable',direction:0};
  const diff=now-before;
  if(diff===0)return {text:'No change',direction:0};
  if(before===0||Math.abs(before)<20)return {text:`${num(Math.abs(diff))} ${diff>0?'more':'fewer'}`,direction:diff>0?1:-1};
  return {text:`${diff>0?'+':'−'}${Math.abs(diff/before*100).toFixed(1)}%`,direction:diff>0?1:-1};
};
export const rankLabel=(r:Keyword)=>r.rankState==='found'?`#${r.rank}`:r.rankState==='error'?'Check unavailable':r.rankState==='not-found'?'Not in top 100':`Not seen in ${r.depth??'partial'} results`;
export function downloadFile(name:string,text:string,type='text/plain'){
  const url=URL.createObjectURL(new Blob([text],{type}));
  const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
}
export function csvDownload(name:string,rows:(string|number|null)[][]){
  downloadFile(name,'\uFEFF'+rows.map(r=>r.map(c=>{const s=String(c??'');const safe=/^[=+@\-]/.test(s)?`'${s}`:s;return `"${safe.replaceAll('"','""')}"`;}).join(',')).join('\r\n'),'text/csv;charset=utf-8');
}

export const tabs=[
  {id:'overview',label:'Overview',title:'The month at a glance'},
  {id:'work',label:'Work completed',title:'Work that has been completed this month'},
  {id:'enquiries',label:'Enquiries',title:'Enquiries & contact'},
  {id:'search',label:'Search performance',title:'Search performance'},
  {id:'keywords',label:'Keywords & local search',title:'Keywords & local search'},
  {id:'backlinks',label:'Backlinks',title:'Backlinks & referrals'},
  {id:'ai-search',label:'AI search',title:'AI search'},
  {id:'technical',label:'Technical health',title:'Technical health'},
  {id:'next-month',label:'Next month',title:'November priorities'},
  {id:'grace',label:'Grace',title:'Grace’s November brief'},
] as const;
export type TabId=typeof tabs[number]['id'];
export const route=(id:TabId)=>`/reports/${report.meta.month}/${id}`;

export type AIAnswer={questionId:string;provider:string;providerLabel:string;state:string;successful:boolean;named:boolean|null;linked:boolean|null;answer:string;citations:{url:string;title:string;clinic:boolean;source:string}[];clinicCitations:{url:string;title:string;clinic:boolean;source:string}[];otherProviders:string[];reviewFlags:string[];clinicExcerpts:string[];possibleTruncation:boolean;requestedAt:string;checkedAt:string|null;model:string;taskId:string|null;statusCode:number|null;statusMessage:string;webSearch:boolean|null;inputTokens:number|null;outputTokens:number|null;costUsd:number;rawPath:string};
export type AICounts={expected:number;attempted:number;successful:number;unavailable:number;named:number;linked:number;both:number;absent:number};
export type AIBaseline={version:string;baselineDate:string;status:string;expectedPairs:number;attemptedPairs:number;successfulPairs:number;costUsd:number;results:AIAnswer[];reviewFindings:{id:string;title:string;questionId:string;provider:string;observed:string;confirmed:string;action:string;status:string}[];summary:{provider:string;label:string;model:string;non_branded:AICounts;branded_accuracy:AICounts;discovery:AICounts;information:AICounts;costUsd:number}[];otherCitedDomains:{domain:string;answerCount:number}[];answerWarning:string;comparisonNote:string};
export const aiBaseline=saved.aiBaseline as AIBaseline;
