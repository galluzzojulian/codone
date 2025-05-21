/**
 * Generates a JavaScript loader that will fetch code from Supabase Edge Function
 * and inject it into the current page.
 */
export interface LoaderConfig {
  id: string | number;
  type: 'page' | 'site';
  location: 'head' | 'body';
  supabaseUrl: string;
  supabaseKey: string;
}

export const generateLoaderScript = (config: LoaderConfig): string => {
  // Convert the ID to a number if it's numeric, otherwise keep it as a string
  const isNumericId = !isNaN(Number(config.id));
  
  // Debug log to troubleshoot ID issues
  console.log(`generateLoaderScript called with:`, {
    id: config.id,
    type: config.id.constructor.name,
    isNumeric: isNumericId,
    convertedId: isNumericId ? config.id : `"${config.id}"`,
    supabaseUrl: config.supabaseUrl
  });
  
  // Ensure we're using the correct ID format
  const idValue = isNumericId ? Number(config.id) : `"${config.id}"`;
  
  // Minified version of the loader script to stay under 2000 characters
  return `(function(){
const c={id:${idValue},type:"${config.type}",location:"${config.location}"};
const newBaseUrl="https://loader.codone-loader.workers.dev/";
fetch(\`\${newBaseUrl}?pageId=\${c.id}&location=\${c.location}\`,{
method:'GET',
headers: {'Content-Type': 'application/json'}
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