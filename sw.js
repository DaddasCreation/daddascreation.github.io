const SHELL = 'shortlist-shell-53454df083d8';
const ASSETS = ["/assets/index-DMGC5d7e.css","/assets/index-RATt4dw1.js","/icons/icon192.png","/icons/icon512.png","/index.html","/manifest.webmanifest"];
const SHARES = 'shortlist-shares';
self.addEventListener('install', event => {event.waitUntil(caches.open(SHELL).then(cache=>cache.addAll(ASSETS)));});
// Do not skipWaiting: an in-progress capture must keep its current app version.
self.addEventListener('activate', event => {event.waitUntil((async()=>{
 for(const key of await caches.keys()) if(key.startsWith('shortlist-shell-')&&key!==SHELL) await caches.delete(key);
 await self.clients.claim();
})());});
self.addEventListener('fetch', event => {
 const url = new URL(event.request.url);
 if(url.origin!==self.location.origin)return;
 if(event.request.method==='POST'&&url.pathname==='/share-target') {
  event.respondWith((async()=>{
   try {
    const form=await event.request.formData();
    const field=name=>typeof form.get(name)==='string'?form.get(name).slice(0,16000):'';
    const input={url:field('url'),text:field('text'),title:field('title'),source:'android-web-share',receivedAt:new Date().toISOString()};
    const cache=await caches.open(SHARES);
    // Expire abandoned shares and bound storage. Separate IDs prevent overwrite races.
    for(const key of await cache.keys()) {
     const response=await cache.match(key);
     try {if(Date.now()-Date.parse((await response.json()).receivedAt)>86400000)await cache.delete(key);}catch{await cache.delete(key);}
    }
    const remaining=await cache.keys();
    for(const key of remaining.slice(0,Math.max(0,remaining.length-49)))await cache.delete(key);
    const id=crypto.randomUUID();
    await cache.put('/_shares/'+id,new Response(JSON.stringify(input),{headers:{'Content-Type':'application/json'}}));
    return Response.redirect(new URL('/capture/shared?id='+id,self.location.origin).href,303);
   }catch{return Response.redirect(new URL('/capture/shared',self.location.origin).href,303);}
  })());return;
 }
 if(event.request.method!=='GET')return;
 if(event.request.mode==='navigate') {
  event.respondWith(caches.open(SHELL).then(async cache=>(await cache.match('/index.html'))||fetch(event.request)));
 }else if(ASSETS.includes(url.pathname)) {
  event.respondWith(caches.open(SHELL).then(async cache=>(await cache.match(url.pathname))||fetch(event.request)));
 }
});
