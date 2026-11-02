import {useState} from 'react';
import {Download} from 'lucide-react';
import {report,num,monthLabel,change,downloadFile} from './model';
import {Section,Note,Tag,Stat} from './components';
const measures=[
 {key:'search',label:'Profile views on Search',parts:['BUSINESS_IMPRESSIONS_DESKTOP_SEARCH','BUSINESS_IMPRESSIONS_MOBILE_SEARCH'],note:'Desktop + mobile daily counts; not website search impressions.'},
 {key:'maps',label:'Profile views on Maps',parts:['BUSINESS_IMPRESSIONS_DESKTOP_MAPS','BUSINESS_IMPRESSIONS_MOBILE_MAPS'],note:'Desktop + mobile daily counts; not a Maps ranking.'},
 {key:'website',label:'Website clicks',parts:['WEBSITE_CLICKS'],note:'Clicks on the profile’s website button; not Analytics visits.'},
 {key:'calls',label:'Call-button clicks',parts:['CALL_CLICKS'],note:'Clicks to call; not completed calls or confirmed enquiries.'},
 {key:'directions',label:'Direction requests',parts:['BUSINESS_DIRECTION_REQUESTS'],note:'Requests for directions; not confirmed clinic visits.'},
];
const data=report.businessProfile;
type Month=typeof data.months[number];
type Measure=typeof measures[number];
function total(row:Month|undefined,m:Measure,partial=false):number|null{
 if(!row)return null;
 const values=m.parts.map(k=>{const v=row.metrics[k as keyof typeof row.metrics];return partial?v.partialValue:v.value;});
 return values.some(v=>v==null)?null:values.reduce<number>((sum,v)=>sum+(v??0),0);
}
const offset=(m:string,n:number)=>{const d=new Date(m+'-15T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+n);return d.toISOString().slice(0,7);};
export default function BusinessProfile(){
 const [month,setMonth]=useState(data.reportMonth),[metric,setMetric]=useState('website');
 const selected=measures.find(m=>m.key===metric)!;
 const find=(m:string)=>data.months.find(r=>r.month===m);
 const latest=data.months.filter(m=>m.closed).at(-1)!;
 const previous=find(offset(latest.month,-1));
 const points=data.months.filter(m=>m.closed),max=Math.max(1,...points.map(r=>total(r,selected)??0));
 const columns=[offset(month,-6),offset(month,-1),month];
 const current=find(month),partial=current&&!current.closed;
 const delta=(a:number|null,b:number|null)=>a==null||b==null?'Not comparable':change(a,b).text;
 return <div id="business-profile">
 <div className="page-summary"><p>How people find and act on the clinic’s Google listing, separately from visits to the website.</p><Tag tone="green">API records · 1 November 2026</Tag></div>
 <Note tone="amber">October has closed, but the saved profile snapshot covers 1–25 October only, using a conservative seven-day processing buffer. Full-month totals and comparisons remain blank until complete data is checked. This is not a claim that Google has finalised every date.</Note>
 <Section title="The latest complete month" description={`${monthLabel(latest.month)} · full calendar month, with every requested date returned.`}>
 <div className="stat-grid four">{measures.filter(m=>['website','calls','directions'].includes(m.key)).map(m=><Stat key={m.key} label={m.label} value={num(total(latest,m))} detail={m.note}/>)}<Stat label="Google reviews · current snapshot" value={`${data.reviews.count} · ${data.reviews.rating.toFixed(1)} / 5`} detail="31 October snapshot. No historical rating or review-count comparisons claimed."/></div>
 <p>In {monthLabel(latest.month)}, the profile generated {num(total(latest,measures[2]))} website clicks, compared with {num(total(previous,measures[2]))} in {monthLabel(offset(latest.month,-1))}. Call-button clicks were {num(total(latest,measures[3]))}, compared with {num(total(previous,measures[3]))}, and direction requests were {num(total(latest,measures[4]))}, compared with {num(total(previous,measures[4]))}. These are signs of interest, rather than confirmed enquiries or admissions. The figures do not establish what caused the changes.</p>
 </Section>
 <Section title="Monthly comparisons" description="Compare complete calendar months using the same measures and clinic listing." action={<button className="button" onClick={()=>downloadFile('Wellbourne_Business_Profile_2026-11-01.json',JSON.stringify(data,null,2),'application/json')}><Download size={15}/>Download figures</button>}>
 <div className="filter-toolbar"><label className="select-label">Reporting month<select value={month} onChange={e=>setMonth(e.target.value)}>{[...data.months].reverse().map(r=><option value={r.month} key={r.month}>{monthLabel(r.month)}{!r.closed?' · pending':''}</option>)}</select></label></div>
 <div className="table-card"><div className="table-scroll"><table className="data-table"><caption className="sr-only">Business Profile full-calendar-month comparisons</caption><thead><tr><th scope="col">Measure</th>{columns.map((m,i)=><th scope="col" key={m}>{monthLabel(m)}<small>{['Six months earlier','Previous month','Selected month'][i]}</small></th>)}<th scope="col">Versus previous</th><th scope="col">Versus six months earlier</th></tr></thead><tbody>{measures.map(m=>{const values=columns.map(c=>total(find(c),m));return <tr key={m.key}><th scope="row">{m.label}<small>{m.note}</small></th>{values.map((v,i)=><td key={i}>{num(v)}{v==null&&<small>{find(columns[i])?.closed?'Coverage unavailable':find(columns[i])?'Full month pending':'History not retrieved'}</small>}</td>)}<td>{delta(values[2],values[1])}</td><td>{delta(values[2],values[0])}</td></tr>;})}</tbody></table></div></div>
 {partial&&<details className="gbp-partial"><summary>View the provisional {monthLabel(month)} snapshot · no monthly comparisons</summary><p>{current.start} to {current.end}; excludes the remaining dates. Do not compare these partial totals with full months.</p><div className="stat-grid four">{measures.map(m=><Stat key={m.key} label={m.label} value={num(total(current,m,true))} detail="Provisional partial period"/>)}</div></details>}
 </Section>
 <Section title="The trend over complete months" description="Choose a measure. Partial October is excluded from this chart.">
 <div className="subnav" aria-label="Business Profile trend measure">{measures.map(m=><button key={m.key} aria-pressed={metric===m.key} onClick={()=>setMetric(m.key)}>{m.label}</button>)}</div>
 <div className="table-card gbp-trend" role="img" aria-label={`${selected.label}: ${points.map(r=>`${monthLabel(r.month)} ${num(total(r,selected))}`).join('; ')}`}>{points.map(r=>{const v=total(r,selected);return <div className="gbp-bar-row" key={r.month}><span>{monthLabel(r.month,true)}</span><div className="gbp-bar-track"><div style={{width:`${v==null?0:v/max*100}%`}}/></div><strong>{num(v)}</strong></div>;})}</div>
 </Section>
 <details className="gbp-method"><summary>Sources, coverage and what these figures mean</summary><p>Retrieved {data.retrievedAt}. All seven daily measures returned every requested date for March–September. Complete coverage is checked per measure before summing. A missing date or missing measure remains unavailable. Google documents that an omitted value on a returned date represents zero.</p><p>Search and Maps profile views are summed daily counts for mobile and desktop. Google deduplicates within each daily measure; these totals are not unique people across a month or across devices. Profile clicks must not be added to website events as a unique enquiry total. This source provides activity, not organic Maps positions.</p><p>Different calendar months contain different numbers of days. Comparisons show total activity, without implying a change in daily rate. Earlier months outside the retrieved March–October window are marked as history not retrieved. Reviews are a current snapshot only.</p><p><a href="https://developers.google.com/my-business/reference/performance/rest/v1/DailyMetric" target="_blank" rel="noreferrer">Google’s metric definitions</a> · <a href="https://developers.google.com/my-business/reference/performance/rest/v1/TimeSeries" target="_blank" rel="noreferrer">Google’s date and zero-value format</a></p><p>Saved extracts: Source Data/Business Profile/2026-11-01/ (March retained from 31 October). Re-run the dated extraction after month end and processing before signing off October. No automatic refresh or recurring task has been enabled.</p></details>
 </div>;
}
