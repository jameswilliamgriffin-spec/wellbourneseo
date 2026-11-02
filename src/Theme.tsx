import {useEffect,useState} from 'react';
import {Sun,Moon,Monitor} from 'lucide-react';
type Preference='system'|'light'|'dark';
export function ThemeControl(){
 const [preference,setPreference]=useState<Preference>(()=>{try{const v=localStorage.getItem('wellbourne-theme');return v==='light'||v==='dark'?v:'system';}catch{return 'system';}});
 useEffect(()=>{const query=matchMedia('(prefers-color-scheme: dark)');const apply=()=>{document.documentElement.dataset.theme=preference==='system'?(query.matches?'dark':'light'):preference;document.documentElement.style.colorScheme=document.documentElement.dataset.theme;};apply();query.addEventListener('change',apply);try{localStorage.setItem('wellbourne-theme',preference);}catch{}return()=>query.removeEventListener('change',apply);},[preference]);
 const Icon=preference==='system'?Monitor:preference==='dark'?Moon:Sun;
 return <label className="theme-control"><Icon size={17} aria-hidden="true"/><span>Theme</span><select aria-label="Report theme" value={preference} onChange={e=>setPreference(e.target.value as Preference)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>;
}
