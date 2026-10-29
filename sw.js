// مصاريفي — يشغّل التطبيق بدون إنترنت ويجيب التحديثات أول ما تنرفع
const V='masareef-v6';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(ASSETS.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
function fromNetwork(r){return fetch(r,{cache:'no-store'}).then(res=>{if(res.ok){const copy=res.clone();caches.open(V).then(c=>c.put(r,copy))}return res})}
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    const page=r.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('.html');
    if(page){
      // the app page: newest version when online (3s max), saved copy when offline
      e.respondWith(new Promise(resolve=>{let done=false;
        const fallback=()=>caches.match(r,{ignoreSearch:true}).then(h=>h||caches.match('./index.html')).then(h=>{if(!done&&h){done=true;resolve(h)}});
        const t=setTimeout(fallback,3000);
        fromNetwork(r).then(res=>{clearTimeout(t);if(!done){done=true;resolve(res)}}).catch(()=>{clearTimeout(t);fallback()});
      }));
    }else{
      e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>hit||fromNetwork(r)));
    }
  }else if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
    e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{const copy=res.clone();caches.open(V).then(c=>c.put(r,copy));return res})));
  }
});
