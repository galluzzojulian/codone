/**
 * Generates a JavaScript loader that will fetch code from Supabase Edge Function
 * and inject it into the current page.
 */
export interface LoaderConfig {
  id: string;
  type: 'page' | 'site';
  location: 'head' | 'body';
  supabaseUrl: string;
  supabaseKey: string;
}

export const generateLoaderScript = (config: LoaderConfig): string => {
  // Minified version of the loader script to stay under 2000 characters
  return `(function(){
const c={id:"${config.id}",type:"${config.type}",location:"${config.location}"};
const u="${config.supabaseUrl}";
const k="${config.supabaseKey}";
fetch(u+"/functions/v1/code-loader",{
method:'POST',
headers:{'Content-Type':'application/json','Authorization':'Bearer '+k},
body:JSON.stringify(c)
}).then(r=>{
if(!r.ok)throw new Error('Load failed: '+r.status);
return r.json()
}).then(d=>{
if(d.css){
const s=document.createElement('style');
s.textContent=d.css;
document.head.appendChild(s);
}
if(d.html){
const h=document.createElement('div');
h.className="codone-injected-container";
h.innerHTML=d.html;
c.location==='head'?document.head.appendChild(h):document.body.appendChild(h);
}
if(d.js){
const j=document.createElement('script');
j.textContent=d.js;
c.location==='head'?document.head.appendChild(j):document.body.appendChild(j);
}
}).catch(e=>console.error('Codone error:',e));
})();`
}; 