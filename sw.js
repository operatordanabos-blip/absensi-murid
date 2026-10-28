// Service worker sederhana: jaringan dulu, cadangan dari cache bila offline.
// Permintaan ke Firebase (lintas-situs) tidak disentuh sama sekali.
// Pustaka & model Face ID (cdn.jsdelivr.net/npm/@vladmandic/face-api) disimpan di cache
// setelah diunduh sekali, jadi pengenalan wajah tetap jalan walau internet putus.
const CACHE='presensi-sdn-v2';
const FACE_CACHE='presensi-face-v1';
const SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
const isFace=u=>u.href.startsWith('https://cdn.jsdelivr.net/npm/@vladmandic/face-api');
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(SHELL.map(u=>c.add(u)))).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==FACE_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(isFace(u)){
    e.respondWith(caches.open(FACE_CACHE).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok||res.type==='opaque')c.put(r,res.clone()).catch(()=>{});return res}))));
    return;
  }
  if(u.origin!==location.origin)return;
  e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp)).catch(()=>{});return res}).catch(()=>caches.match(r).then(m=>m||caches.match('./index.html'))));
});
