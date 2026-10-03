import { readdir, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
export async function buildPWA(destination, buildId) {
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (!['_headers', '.nojekyll', 'version.json', 'sw.js'].includes(entry.name))
        files.push('./' + relative(destination, path).split('\\').join('/'));
    }
  }
  await walk(destination);
  const source = `const BUILD=${JSON.stringify(buildId)},FILES=${JSON.stringify(files.sort())};
const ROOT=new URL('./',self.location.href),PREFIX='osi-quest:'+ROOT.href+':',CACHE=PREFIX+BUILD;
self.addEventListener('install',event=>event.waitUntil((async()=>{try{const cache=await caches.open(CACHE);await cache.addAll(FILES.map(file=>new Request(new URL(file,ROOT),{cache:'reload'})));}catch(error){await caches.delete(CACHE);throw error;}})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{await self.clients.claim();const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});if(windows.filter(c=>c.url.startsWith(ROOT.href)).length<=1){for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);}})()));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE')event.waitUntil((async()=>{const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});const own=windows.filter(client=>client.url.startsWith(ROOT.href));if(own.length>1){event.source?.postMessage({type:'UPDATE_BLOCKED'});return;}await self.skipWaiting();})());});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==ROOT.origin||!url.href.startsWith(ROOT.href)||url.pathname.endsWith('/version.json')||url.pathname.endsWith('/sw.js'))return;
event.respondWith((async()=>{const cache=await caches.open(CACHE);const key=event.request.mode==='navigate'?new URL('index.html',ROOT):new URL(url.pathname,ROOT.origin);const response=await cache.match(key);return response||fetch(event.request);})());});
`;
  await writeFile(resolve(destination, 'sw.js'), source);
  return files.length;
}
