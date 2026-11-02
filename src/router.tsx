import { useEffect, useState, type AnchorHTMLAttributes } from 'react';

// Adapted from the Livingstone report's small addressable-tab router.
// No client identity, data, commitments or application files are shared.
const EVENT='wellbourne-v2:navigate';
export function usePath(){
  const [path,setPath]=useState(()=>window.location.pathname);
  useEffect(()=>{const update=()=>setPath(window.location.pathname);window.addEventListener('popstate',update);window.addEventListener(EVENT,update);return()=>{window.removeEventListener('popstate',update);window.removeEventListener(EVENT,update);};},[]);
  return path;
}
export function navigate(to:string,replace=false){
  if(replace)window.history.replaceState(null,'',to);else window.history.pushState(null,'',to);
  window.dispatchEvent(new Event(EVENT));window.scrollTo({top:0,behavior:'instant'});
}
export function Link({to,onClick,...props}:AnchorHTMLAttributes<HTMLAnchorElement>&{to:string}){
  return <a href={to} {...props} onClick={e=>{onClick?.(e);if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.altKey||e.shiftKey)return;e.preventDefault();navigate(to);}}/>;
}
