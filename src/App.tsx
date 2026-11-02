import { AIAnswerDetails } from './AIAnswers';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, CalendarDays, ChartNoAxesCombined, ChevronDown, ChevronRight, CircleHelp, FileText, LayoutDashboard, Link2, ListChecks, Menu, MessageCircle, Printer, Search, ShieldCheck, UserRound, Workflow, X } from 'lucide-react';
import { report, tabs, route, num, pct, pathOf, rankLabel, dayLabel, type TabId, type Keyword, type Question, type Issue, type SearchPage } from './model';
import { Link, navigate, usePath } from './router';
import { Dialog, External, Note, Sources, Tag, GraceDownload } from './components';
import Overview from './Overview';
import {ThemeControl} from './Theme';
import SearchPerformance from './SearchPerformance';
import Keywords from './Keywords';
import AISearch from './AISearch';
import { WorkCompleted, Enquiries, Backlinks, TechnicalHealth, NextMonth, Grace } from './SupportingPages';

const icons={overview:LayoutDashboard,work:ListChecks,enquiries:MessageCircle,search:ChartNoAxesCombined,keywords:Search,backlinks:Link2,'ai-search':Workflow,technical:ShieldCheck,'next-month':CalendarDays,grace:UserRound};
type Modal={type:'sources'}|{type:'keyword';value:Keyword}|{type:'question';value:Question;provider?:string}|{type:'issue';value:Issue}|{type:'page';value:SearchPage};

export default function App(){
  const path=usePath();const [modal,setModal]=useState<Modal|null>(null),[mobileOpen,setMobileOpen]=useState(false);
  const heading=useRef<HTMLHeadingElement>(null);
  const suffix=path.split('/').filter(Boolean).at(-1);
  const isArchive=path==='/reports'||path==='/reports/';
  const correctMonthPath=path.startsWith('/reports/2026-10/');
  const printMode=correctMonthPath&&suffix==='print';
  const tab=correctMonthPath?tabs.find(t=>t.id===suffix):undefined;
  const active:TabId=tab?.id??'overview';
  const valid=!!tab||isArchive||printMode||path==='/';
  useEffect(()=>{if(path==='/')navigate(route('overview'),true);},[path]);
  useEffect(()=>{setMobileOpen(false);document.title=`${printMode?'Print report':isArchive?'Reports':tab?.label??'Page not found'} · October 2026 · The Wellbourne Clinic`;heading.current?.focus({preventScroll:true});},[path,printMode,isArchive,tab?.label]);
  useEffect(()=>{if(printMode){document.querySelectorAll<HTMLDetailsElement>('main details').forEach(el=>{el.open=true;});}},[printMode]);
  useEffect(()=>{
    if(!mobileOpen)return;
    document.querySelector<HTMLAnchorElement>('.sidebar nav a')?.focus();
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){setMobileOpen(false);document.querySelector<HTMLButtonElement>('.mobile-topbar button')?.focus();}
      if(event.key==='Tab'){
        const items=Array.from(document.querySelectorAll<HTMLElement>('.sidebar a, .mobile-topbar button')).filter(e=>e.getBoundingClientRect().height>0);
        const first=items[0],last=items.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    document.addEventListener('keydown',onKey);return()=>document.removeEventListener('keydown',onKey);
  },[mobileOpen]);
  function page(id:TabId,printing=false):ReactNode{
    switch(id){
      case 'overview':return <Overview/>;
      case 'work':return <WorkCompleted/>;
      case 'enquiries':return <Enquiries/>;
      case 'search':return <SearchPerformance onPage={value=>setModal({type:'page',value})}/>;
      case 'keywords':return <Keywords printMode={printing} onKeyword={value=>setModal({type:'keyword',value})}/>;
      case 'backlinks':return <Backlinks printMode={printing}/>;
      case 'ai-search':return <AISearch printMode={printing} onQuestion={(value,provider)=>setModal({type:'question',value,provider})}/>;
      case 'technical':return <TechnicalHealth onIssue={value=>setModal({type:'issue',value})}/>;
      case 'next-month':return <NextMonth/>;
      case 'grace':return <Grace/>;
    }
  }
  return <div className={`app ${printMode?'print-view':''}`}><a className="skip-link" href="#main">Skip to report</a>
    <div className="mobile-topbar"><Link to={route('overview')} className="mobile-brand"><img src="/brand/mark.png" alt=""/><span>The Wellbourne Clinic</span></Link><button className="icon-button" aria-expanded={mobileOpen} aria-controls="report-navigation" aria-label={mobileOpen?'Close report menu':'Open report menu'} onClick={()=>setMobileOpen(!mobileOpen)}>{mobileOpen?<X/>:<Menu/>}</button></div>
    {mobileOpen&&<button className="nav-scrim" aria-label="Close report menu" onClick={()=>setMobileOpen(false)}/>}
    <aside className={`sidebar ${mobileOpen?'open':''}`} id="report-navigation"><Link to={route('overview')} className="sidebar-brand" aria-label="The Wellbourne Clinic report overview"><div className="sidebar-mark"><img src="/brand/mark.png" alt=""/></div><span>THE WELLBOURNE<br/><b>CLINIC</b></span></Link><div className="sidebar-report"><span>Website & search</span><strong>Monthly report</strong></div><nav aria-label="Report pages">{tabs.map(t=>{const Icon=icons[t.id];return <Link key={t.id} to={route(t.id)} aria-current={active===t.id&&!isArchive&&!printMode?'page':undefined} className={`nav-link ${active===t.id&&!isArchive&&!printMode?'active':''}`} title={t.title}><Icon size={18} strokeWidth={1.7}/><span>{t.label}</span>{t.id==='grace'&&<span className="nav-grace" aria-hidden="true">G</span>}</Link>;})}</nav><div className="sidebar-bottom"><Link to="/reports"><CalendarDays size={16}/>Report archive<ChevronRight size={15}/></Link><div><span className="sidebar-live-dot"/><p>Version 2<small>Presentation edition</small></p></div></div></aside>
    <div className="main-shell" inert={mobileOpen?true:undefined}><header className="topbar"><div className="breadcrumb"><span>The Wellbourne Clinic</span><ChevronRight size={13}/><span>{isArchive?'Report archive':'October 2026'}</span></div><div className="topbar-actions"><a className="button report-logout" href="/report-logout">Log out</a><ThemeControl/><button className="sources-button" aria-label="Sources and definitions" onClick={()=>setModal({type:'sources'})}><CircleHelp size={16}/><span>Sources & definitions</span></button>{!printMode&&!isArchive&&<Link to="/reports/2026-10/print" className="button"><Printer size={15}/><span>Print / PDF</span></Link>}</div></header>
    <main id="main" className="content"><div className="report-heading"><div><div className="report-heading-meta"><span>{isArchive?'Monthly reporting':'October report'}</span>{!isArchive&&<Tag tone="amber">Presentation edition</Tag>}</div><h1 ref={heading} tabIndex={-1}>{isArchive?'Report archive':printMode?'October 2026':!valid?'Page not found':active==='overview'?'October 2026':tabs.find(t=>t.id===active)!.title}</h1><p>{isArchive?'Saved months, with their original evidence and reporting status.':printMode?'October report, prepared 1 November and refreshed 2 November 2026. Business Profile remains partial.':active==='overview'?'Website improvements, search visibility and the work ahead.':intro(active)}</p></div><div className="prepared-date"><span>Prepared</span><strong>1 November 2026</strong><small>{isArchive?'One working month':'Refreshed 2 November · profile partial'}</small></div></div>
    {printMode?<><div className="print-actions"><Link to={route('overview')} className="button"><ArrowLeft size={15}/>Back to report</Link><button className="button button-green" onClick={()=>window.print()}><Printer size={16}/>Save as PDF / print</button><p>All 95 keywords and 25 AI questions are included. Use your browser’s PDF destination.</p></div>{tabs.map(t=><section className="print-section" key={t.id}><h2 className="print-section-title">{t.title}</h2>{page(t.id,true)}</section>)}<section className="print-section"><h2 className="print-section-title">Sources & definitions</h2><Sources/></section></>:isArchive?<div className="archive-list"><Link to={route('overview')}><span className="archive-month">October <em>2026</em></span><div><Tag tone="amber">Presentation edition</Tag><p>Work and baseline evidence saved. October search and visits included; Business Profile partial through 25 October.</p></div><ChevronRight size={23}/></Link><Note>Earlier calendar months appear in the evidence, but they have not been presented here as published monthly reports. The original Wellbourne report remains unchanged in its separate application.</Note></div>:!valid?<Note>This report page does not exist. <Link to={route('overview')}>Return to October’s overview.</Link></Note>:<div key={active} className={`page-enter page-${active}`}>{page(active)}</div>}
    <footer className="report-footer"><div><span className="footer-mark">W</span><p>The Wellbourne Clinic<small>October 2026 · presentation edition v2</small></p></div><button onClick={()=>setModal({type:'sources'})}>Saved evidence, clear definitions<ArrowUpRight size={14}/></button></footer></main></div>
    {modal&&<Dialog title={modal.type==='sources'?'Sources & definitions':modal.type==='keyword'?modal.value.keyword:modal.type==='question'?modal.value.id:modal.type==='issue'?modal.value.title:modal.value.title} close={()=>setModal(null)}>{modal.type==='sources'?<Sources/>:modal.type==='keyword'?<KeywordDetails k={modal.value}/>:modal.type==='question'?<AIAnswerDetails key={modal.value.id+(modal.provider??'chat_gpt')} q={modal.value} initialProvider={modal.provider}/>:modal.type==='issue'?<IssueDetails issue={modal.value}/>:<PageDetails p={modal.value}/>}</Dialog>}
  </div>;
}

function intro(id:TabId){return {
  overview:'Website improvements, search visibility and the work ahead.',
  work:'What we did, why we did it and what has actually been checked.',
  enquiries:'Keep successful enquiries separate from the steps people take to contact us.',
  search:'How people found the website, with the source and period kept clear.',
  keywords:'Existing visibility and new opportunities, checked in a consistent context.',
  backlinks:'The incoming-link profile, relevant relationships and verified outcomes.',
  'ai-search':'Whether the clinic is named or linked to in answers to relevant questions.',
  technical:'Recorded repairs, unresolved findings and the checks still needed.',
  'next-month':'Proposed priorities, clear owners and decisions needed before the work.',
  grace:'Practical tasks, useful source material and a clear definition of done.',
}[id];}

function KeywordDetails({k}:{k:Keyword}){return <><div className="dialog-status"><Tag tone={k.rank!=null?'green':'neutral'}>{rankLabel(k)}</Tag><Tag>{k.status}</Tag></div><p className="dialog-lede">{k.reason}</p><dl className="evidence-dl"><div><dt>Dedicated check</dt><dd>23 October 2026 · Google UK · English · mobile Android</dd></div><div><dt>Search origin</dt><dd>{k.location}</dd></div><div><dt>Actual returned depth</dt><dd>{num(k.depth)} organic results</dd></div><div><dt>Check status</dt><dd>{k.rankNote}</dd></div><div><dt>Observed ranking page</dt><dd>{k.rankingUrl?<External href={k.rankingUrl}>{pathOf(k.rankingUrl)}</External>:'Not available from this check'}</dd></div><div><dt>Proposed target</dt><dd>{k.targetUrl?<External href={k.targetUrl}>{pathOf(k.targetUrl)}</External>:'Content gap / review required'}</dd></div><div><dt>UK monthly volume estimate</dt><dd>{num(k.volume)}<small>{k.volumeSource}</small></dd></div><div><dt>Organic difficulty estimate</dt><dd>{num(k.difficulty)} / 100<small>Vendor metric; not paid advertising competition.</small></dd></div></dl><h3 className="dialog-subhead">Search Console evidence</h3><p className="small muted">UK web · July–September 2026. Not the same measurement as the dedicated snapshot.</p><div className="mini-stats"><div><span>Appearances</span><strong>{num(k.impressions)}</strong></div><div><span>Clicks</span><strong>{num(k.clicks)}</strong></div><div><span>Average position</span><strong>{num(k.position,1)}</strong></div></div>{k.confirmation&&<Note>{k.confirmation}</Note>}{!k.activeScope&&<Note>Retained in the original research cohort. Outside current active content scope; no new cost/ketamine work is proposed here.</Note>}<Note>This is the first dated dedicated baseline. Previous-month and six-month dedicated rankings are unavailable.</Note></>;}

function IssueDetails({issue}:{issue:Issue}){return <><div className="dialog-status"><Tag tone={issue.status==='Fixed and checked'?'green':'amber'}>{issue.status}</Tag><Tag>{issue.priority}</Tag></div><p className="dialog-lede">{issue.summary}</p><dl className="evidence-dl"><div><dt>Original scope</dt><dd>{issue.affected}</dd></div><div><dt>Original audit date</dt><dd>22 October 2026</dd></div><div><dt>Original observation</dt><dd>{issue.originalEvidence}</dd></div><div><dt>Recorded action / next step</dt><dd>{issue.recommendation}</dd></div><div><dt>Related activity</dt><dd><code>{issue.evidence}</code></dd></div></dl><Note>{issue.scopeNote} Original recommendations may be superseded by a later repair; use the reconciled status before assigning work.</Note></>;}

function PageDetails({p}:{p:SearchPage}){return <><External href={p.url}>{p.path}</External><p className="dialog-lede">UK page evidence for 1 July–30 September 2026, compared with April–June where available.</p><div className="mini-stats"><div><span>Appearances</span><strong>{num(p.impressions)}</strong></div><div><span>Clicks</span><strong>{num(p.clicks)}</strong></div><div><span>Click rate</span><strong>{pct(p.ctr,2)}</strong></div></div><dl className="evidence-dl"><div><dt>GSC average position</dt><dd>{num(p.position,1)}</dd></div><div><dt>Previous quarter’s clicks</dt><dd>{num(p.previousClicks)}</dd></div><div><dt>UK Google-organic landing sessions</dt><dd>{num(p.sessions)}</dd></div><div><dt>Engaged sessions</dt><dd>{num(p.engaged)}</dd></div><div><dt>Enquiries</dt><dd>Not comparable. A reliable historical enquiry baseline is not available.</dd></div></dl><Note>Search Console and Analytics are separate aggregate views. Analytics does not identify the exact organic query behind an enquiry. Missing landing-page rows do not prove zero visits.</Note></>;}
