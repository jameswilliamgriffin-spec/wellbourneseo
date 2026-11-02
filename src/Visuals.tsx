import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { report, num, metricFormat, monthLabel, type Metric, type MonthPoint } from './model';
import { Delta } from './components';

/** The same measured observations drive the graphic, readout and accessible table. */
export function EvidenceChart({ points, metric, compare = false, scope = 'all' }: {
  points: MonthPoint[]; metric: Metric; compare?: boolean; scope?: 'all' | 'uk';
}) {
  const id = useId().replaceAll(':', '');
  const element = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  const [active, setActive] = useState<number | null>(null);
  useEffect(() => {
    if (!element.current) return;
    const observer = new ResizeObserver(entries => setWidth(Math.max(250, entries[0].contentRect.width)));
    observer.observe(element.current);
    return () => observer.disconnect();
  }, []);
  const index = Math.min(active ?? points.length - 1, points.length - 1);
  const item = points[index];
  if (!item) return <p>No compatible observations are available for this measure.</p>;
  const w = width, h = w < 500 ? 240 : 300;
  const L = w < 500 ? 57 : 76, R = compare ? 50 : 22, T = 32, B = 42;
  const values = points.flatMap(p => p[metric] == null ? [] : [p[metric]!]);
  const rawMax = Math.max(...values, 1e-6) * 1.12;
  const unit = 10 ** Math.floor(Math.log10(rawMax));
  const max = Math.ceil(rawMax / unit * 2) / 2 * unit;
  const innerL = L + (compare ? 40 : 0);
  const x = (i: number) => innerL + i * (w - innerL - R) / Math.max(1, points.length - 1);
  const y = (v: number) => h - B - v / max * (h - T - B);
  const consecutive = (a: string, b: string) => {
    const [ay, am] = a.split('-').map(Number), [by, bm] = b.split('-').map(Number);
    return (by - ay) * 12 + bm - am === 1;
  };
  const segments: { point: MonthPoint; index: number }[][] = [];
  points.forEach((point, i) => {
    if (point[metric] == null) return;
    if (!i || points[i - 1][metric] == null || !consecutive(points[i - 1].month, point.month)) segments.push([]);
    segments.at(-1)!.push({ point, index: i });
  });
  const labelEvery = Math.max(1, Math.ceil(points.length / (w < 500 ? 4 : 8)));
  const barWidth = Math.min(76, (w - L - R) / Math.max(points.length, 1) * .65);
  const keyboard = (e: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    setActive(e.key === 'Home' ? 0 : e.key === 'End' ? points.length - 1 : Math.max(0, Math.min(points.length - 1, index + (e.key === 'ArrowRight' ? 1 : -1))));
  };
  const scopeLabel = metric === 'sessions' ? 'Google organic sessions · all countries' : `Google web · ${scope === 'uk' ? 'United Kingdom' : 'all countries'}`;
  return <figure className={`evidence-chart ${compare ? 'comparison-chart' : ''}`}>
    <figcaption className="plot-period">{monthLabel(points[0].month)}–{monthLabel(points.at(-1)!.month)} · monthly observations</figcaption>
    <div className="plot-reading" aria-live="polite"><span>{monthLabel(item.month)}{item.month === report.meta.month ? ' · provisional' : ''}</span><strong>{metricFormat(item[metric], metric)}</strong><small>{scopeLabel}{metric === 'position' ? ' · lower is better' : metric === 'ctr' ? ' · clicks ÷ appearances' : ''}</small></div>
    <div ref={element} className="plot-area" tabIndex={0} role="group" aria-label="Explore chart. Use left and right arrows, Home or End to select a month." onKeyDown={keyboard} onPointerMove={e => {
      if (e.pointerType === 'touch') return;
      const r = e.currentTarget.getBoundingClientRect();
      setActive(Math.max(0, Math.min(points.length - 1, Math.round((e.clientX - r.left - innerL) / (w - innerL - R) * (points.length - 1)))));
    }} onPointerLeave={() => setActive(null)}>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${metric}: ${points.map(p => `${monthLabel(p.month)} ${p[metric] == null ? 'unavailable' : metricFormat(p[metric], metric)}`).join('; ')}`}>
        <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--plot)" stopOpacity=".27"/><stop offset="100%" stopColor="var(--plot)" stopOpacity=".015"/></linearGradient><pattern id={`${id}-hatch`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><line x1="0" y1="0" x2="0" y2="7" stroke="currentColor" strokeOpacity=".2" strokeWidth="2"/></pattern></defs>
        {[0, .25, .5, .75, 1].map(t => <g key={t}><line x1={L} x2={w - R} y1={y(max * t)} y2={y(max * t)} className="plot-grid"/><text x={L - 12} y={y(max * t) + 5} textAnchor="end" className="plot-label">{metric === 'ctr' ? `${(max * t * 100).toFixed(1)}%` : max > 10000 ? `${Math.round(max * t / 1000)}k` : num(max * t, metric === 'position' ? 1 : 0)}</text></g>)}
        {compare ? points.map((p, i) => p[metric] != null && <g key={p.month}><rect x={x(i) - barWidth / 2} y={y(max)} width={barWidth} height={h - B - y(max)} fill={`url(#${id}-hatch)`} rx="10"/><rect x={x(i) - barWidth / 2} y={y(p[metric]!)} width={barWidth} height={h - B - y(p[metric]!)} className={`plot-bar ${i === points.length - 1 ? 'latest' : ''}`} rx="10"/><text x={x(i)} y={y(p[metric]!) - 12} textAnchor="middle" className="plot-label plot-number">{metricFormat(p[metric], metric)}</text></g>) : <>
          {segments.map((segment, i) => { const line = segment.map(p => `${x(p.index)},${y(p.point[metric]!)}`).join(' '); return <g key={i}><polygon points={`${x(segment[0].index)},${h - B} ${line} ${x(segment.at(-1)!.index)},${h - B}`} fill={`url(#${id})`}/><polyline points={line} className="plot-line"/></g>; })}
          <line x1={x(index)} x2={x(index)} y1={T} y2={h - B} className="plot-guide"/>{points.map((p, i) => p[metric] != null && <circle key={p.month} cx={x(i)} cy={y(p[metric]!)} r={i === index ? 6 : 3} className={`plot-dot ${i === index ? 'active' : ''}`}/>)}
        </>}
        {points.map((p, i) => (compare || i % labelEvery === 0 || i === points.length - 1) && <text key={p.month} x={x(i)} y={h - 12} textAnchor="middle" className="plot-label">{monthLabel(p.month, true)}</text>)}
      </svg>
    </div>
    <div className="plot-months" aria-label="Choose a month">{points.map((p, i) => <button key={p.month} onClick={() => setActive(i)} aria-pressed={index === i} aria-label={`${monthLabel(p.month)}: ${p[metric] == null ? 'unavailable' : metricFormat(p[metric], metric)}`}>{monthLabel(p.month, true)}</button>)}</div>
    <details className="plot-table"><summary>View the data table</summary><div className="table-scroll"><table><caption className="sr-only">{scopeLabel}: {metric}</caption><thead><tr><th>Month</th><th>Value</th><th>Coverage</th></tr></thead><tbody>{points.map(p => <tr key={p.month}><th>{monthLabel(p.month)}</th><td>{p[metric] == null ? 'Unavailable' : metricFormat(p[metric], metric)}</td><td>{p[metric] == null ? 'No compatible observation' : p.month === report.meta.month ? 'Calendar month · provisional' : 'Calendar month'}</td></tr>)}</tbody></table></div></details>
  </figure>;
}

export function InsightBand({title,text,tone='mint',label}:{title:string;text:string;tone?:string;label:string}){return <article className={`insight-band ${tone}`}><span className="insight-index">{label}</span><div><h3>{title}</h3><p>{text}</p></div></article>;}
export function PageBars(){const pages=report.octoberRefresh.pages.slice(0,5),max=Math.max(...pages.map(p=>Number(p.Clicks)),1);return <div className="page-bars">{pages.map(p=>{const path=new URL(p['Top pages']).pathname;return <div className="page-bar-row" key={path}><div><span>{path==='/'?'Homepage':path.replaceAll('/','').replaceAll('-',' ')}</span><strong>{num(Number(p.Clicks))} <small>clicks</small></strong></div><div className="bar-track"><span style={{width:`${Number(p.Clicks)/max*100}%`}}/></div></div>})}<p className="small muted">1–31 October · all-country web · provisional. Top returned pages by clicks; page sums can differ from property totals.</p></div>;}
export function ComparisonMetric({metric,previous}:{metric:'clicks'|'impressions'|'sessions';previous:'month'|'six'}){const now=report.octoberRefresh.current;const before=report.months[previous==='month'?5:0];return <Delta now={now[metric]} before={before[metric]} label={`vs ${previous==='month'?'September':'April'}`}/>;}
