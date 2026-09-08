import http from 'node:http';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {analyze} from './lib/analysis.js';
import {demo} from './lib/demo.js';
try { process.loadEnvFile('.env'); } catch(e) { if(e.code!=='ENOENT')throw e; }
const port=Number(process.env.PORT)||3000;
const token=process.env.GITHUB_TOKEN;
const dataDir=process.env.DATA_DIR||'.data';
await mkdir(dataDir,{recursive:true});
let state;
try {state=JSON.parse(await readFile(join(dataDir,'state.json'),'utf8'));} catch(e) {if(e.code!=='ENOENT')throw e;state={mode:'demo',account:'Demo workspace',repos:demo()};}
let busy=false;
const save=async()=>{await writeFile(join(dataDir,'state.tmp'),JSON.stringify(state));await rename(join(dataDir,'state.tmp'),join(dataDir,'state.json'));};
async function github(path,method='GET',body) {
 const response=await fetch(`https://api.github.com${path}`,{method,headers:{Accept:'application/vnd.github+json','User-Agent':'repository-intelligence',...(token?{Authorization:`Bearer ${token}`} : {}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
 if(!response.ok) throw new Error(`GitHub ${response.status}: ${(await response.json()).message || 'Request failed'}`);
 return response.status===204 ? {} : response.json();
}
async function body(req) {let s='';for await(const chunk of req){s+=chunk;if(s.length>100000)throw new Error('Request too large');}return s?JSON.parse(s):{};}
async function inspect(r) {
 const base=`/repos/${r.full_name}`;
 const tree=await github(`${base}/git/trees/${encodeURIComponent(r.default_branch)}?recursive=1`);
 const files=tree.tree.filter(f=>f.type==='blob').map(f=>f.path);
 let contents='';
 const targets=files.filter(p=>/(^|\/)(readme.md|package.json|pyproject.toml|requirements.txt|cmakelists.txt)$/i.test(p)).slice(0,5);
 for(const p of targets) {const f=await github(`${base}/contents/${p.split('/').map(encodeURIComponent).join('/')}`);if(f.content && f.size<100000)contents+=Buffer.from(f.content,'base64').toString('utf8').slice(0,12000);}
 r.analysis=analyze(r,files.slice(0,5000),contents);r.analysis.treeTruncated=tree.truncated;
}
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
http.createServer(async(req,res)=>{
 try {
 const url=new URL(req.url,`http://localhost:${port}`);
 if(![`localhost:${port}`,`127.0.0.1:${port}`].includes(req.headers.host))return json(res,403,{error:'Invalid host'});
 if(req.method!=='GET' && req.headers.origin && ![`http://localhost:${port}`,`http://127.0.0.1:${port}`].includes(req.headers.origin))return json(res,403,{error:'Invalid origin'});
 if(url.pathname.startsWith('/api/')) {
 if(req.method==='GET' && url.pathname==='/api/state')return json(res,200,{...state,connected:!!token});
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 if(!req.headers['content-type']?.startsWith('application/json'))return json(res,415,{error:'JSON content type required'});
 if(busy)return json(res,409,{error:'An operation is in progress. Please try again shortly.'});
 const data=await body(req);
 busy=true;
 try {
 if(url.pathname==='/api/sync') {
  if(!token && !/^[a-zA-Z0-9-]{1,39}$/.test(data.username||''))throw new Error('Enter a valid GitHub username, or configure GITHUB_TOKEN.');
  const account=token?(await github('/user')).login:data.username;
  let repos=[];
  for(let page=1;;page++) {const batch=await github(token?`/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator,organization_member&page=${page}`:`/users/${account}/repos?per_page=100&sort=pushed&page=${page}`);repos.push(...batch);if(batch.length<100)break;}
  const prior=new Map(state.mode==='github'?state.repos.map(r=>[r.id,r]):[]);
  repos=repos.map(r=>({...r,analysis:prior.get(r.id)?.pushed_at===r.pushed_at?prior.get(r.id).analysis:analyze(r),local:prior.get(r.id)?.local||{tags:[],notes:'',review:'Unreviewed',favorite:false}}));
  state={mode:'github',account,repos,syncedAt:new Date().toISOString()};
 } else if(url.pathname==='/api/demo') {state={mode:'demo',account:'Demo workspace',repos:demo()};}
 else if(url.pathname==='/api/local') {
  const r=state.repos.find(r=>r.id===data.id);if(!r)throw new Error('Repository not found');
  const p=data.patch||{};
  for(const key of ['notes','review','status','projectType','cluster'])if(typeof p[key]==='string' && p[key].length<20000)r.local[key]=p[key];
  if(Array.isArray(p.tags))r.local.tags=p.tags.filter(t=>typeof t==='string').slice(0,30);
  if(typeof p.favorite==='boolean')r.local.favorite=p.favorite;
 } else if(url.pathname==='/api/analyze') {
  const r=state.repos.find(r=>r.id===data.id);if(!r)throw new Error('Repository not found');
  if(state.mode==='github')await inspect(r);else r.analysis.analyzedAt=new Date().toISOString();
 } else if(url.pathname==='/api/manage') {
  const allowed=['archive','unarchive','public','private','delete','rename','description','topics'];
  if(!allowed.includes(data.action))throw new Error('Unsupported action');
  const targets=state.repos.filter(r=>(data.ids||[]).includes(r.id));
  if(!targets.length || targets.length!==data.ids.length)throw new Error('Invalid repository selection');
  if(data.confirmation!==targets.map(r=>r.full_name).sort().join(','))throw new Error('Explicit confirmation required');
  if(data.action==='delete' && (targets.length!==1 || data.typedName!==targets[0].name))throw new Error('Type the repository name to delete it');
  if(state.mode==='github'&&!token)throw new Error('Configure GITHUB_TOKEN to manage repositories.');
  const archiveName=typeof data.archiveName==='string'?data.archiveName.trim():'';
  if(archiveName){
   if(data.action!=='archive'||targets.length!==1)throw Error('Rename while archiving requires a single repository.');
   if(!/^(?!\.{1,2}$)[\w.-]{1,100}$/.test(archiveName))throw Error('Use 1–100 letters, numbers, hyphens, underscores, or periods for the repository name.');
   const target=targets[0];
   if(state.repos.some(r=>r.id!==target.id&&r.owner.login.toLowerCase()===target.owner.login.toLowerCase()&&r.name.toLowerCase()===archiveName.toLowerCase()))throw Error('A repository with that name already exists for this owner.');
  }
  const completed=[];let error;
  for(const r of targets)try {
   let patch=data.action==='archive'?{archived:true,...(archiveName?{name:archiveName}:{})}:data.action==='unarchive'?{archived:false}:data.action==='public'?{private:false}:data.action==='private'?{private:true}:data.action==='rename'?{name:data.value}:data.action==='description'?{description:data.value}:{};
   if(data.action==='rename'&&!/^[\w.-]{1,100}$/.test(data.value||''))throw new Error('Invalid repository name');
   if(state.mode==='github')await github(`/repos/${r.full_name}${data.action==='topics'?'/topics':''}`,data.action==='delete'?'DELETE':data.action==='topics'?'PUT':'PATCH',data.action==='delete'?undefined:data.action==='topics'?{names:String(data.value).split(',').map(s=>s.trim()).filter(Boolean)}:patch);
   if(data.action==='delete')state.repos=state.repos.filter(x=>x.id!==r.id);else {Object.assign(r,patch);if(data.action==='rename'||archiveName){r.full_name=`${r.owner.login}/${r.name}`;if(r.html_url)r.html_url=`https://github.com/${r.full_name}`;}if(data.action==='topics')r.topics=String(data.value).split(',').map(s=>s.trim()).filter(Boolean);if(data.action==='archive')r.analysis.status='Archived';if(data.action==='unarchive')r.analysis.status='Paused';}
   completed.push(r.full_name);
  }catch(e){error=e.message;break;}
  await save();return json(res,error?400:200,{completed,error,...(!error?{ok:true}:{})});
 }else return json(res,404,{error:'Unknown endpoint'});
 await save();return json(res,200,{ok:true});
 } finally {busy=false;}
 }
 const paths={'/':'public/index.html','/app.js':'public/app.js','/style.css':'public/style.css','/analysis.js':'lib/analysis.js','/saved-connection.js':'public/saved-connection.js','/runtime-config.js':'public/runtime-config.js','/hosted-api.js':'public/hosted-api.js','/hosted-settings.js':'public/hosted-settings.js','/demo.js':'lib/demo.js','/firebase.js':'public/firebase.js','/firebase-config.js':'public/firebase-config.js'};
 const path=paths[url.pathname];if(!path){res.writeHead(404);return res.end('Not found');}
 res.writeHead(200,{'Content-Type':path.endsWith('.html')?'text/html':path.endsWith('.css')?'text/css':'text/javascript','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' https://www.gstatic.com https://apis.google.com; img-src 'self' data:; connect-src 'self' https://*.googleapis.com https://repowise-neumont.firebaseapp.com; frame-src https://repowise-neumont.firebaseapp.com https://accounts.google.com; frame-ancestors 'none'"});res.end(await readFile(path));
 } catch(e){json(res,400,{error:e.message});}
}).listen(port,'127.0.0.1',()=>console.log(`Repository Intelligence running at http://localhost:${port}`));
