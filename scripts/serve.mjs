import http from 'node:http';
import { createReadStream, statSync, existsSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist');
const port = Number(process.env.FILM_PORT || 4197);
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.woff2':'font/woff2', '.mp3':'audio/mpeg', '.svg':'image/svg+xml', '.txt':'text/plain; charset=utf-8', '.png':'image/png' };
if(!existsSync(resolve(root,'index.html'))) { console.error('먼저 npm run build를 실행해 주세요.'); process.exit(1); }
http.createServer((req,res)=>{
  let path;
  try { path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname)); } catch { res.writeHead(400).end(); return; }
  if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}
  if(path===root) path=resolve(root,'index.html');
  let stat; try{stat=statSync(path);if(!stat.isFile())throw new Error();}catch{res.writeHead(404).end('Not found');return;}
  const headers={'Content-Type':mime[extname(path)]||'application/octet-stream','Accept-Ranges':'bytes','Content-Length':stat.size,'X-Content-Type-Options':'nosniff'};
  let start=0,end=stat.size-1;
  if(req.headers.range){
    const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
    if(!match){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
    start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),end):end;
    if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
    headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;headers['Content-Length']=end-start+1;
    res.writeHead(206,headers);
  }else res.writeHead(200,headers);
  if(req.method==='HEAD'){res.end();return;}
  createReadStream(path,{start,end}).on('error',()=>res.destroy()).pipe(res);
}).listen(port,'127.0.0.1',()=>console.log(`끝까지 사랑하시니: http://127.0.0.1:${port}`));
