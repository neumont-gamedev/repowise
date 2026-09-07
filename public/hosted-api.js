import {analyze} from './analysis.js';
import {demo} from './demo.js';
let token='';
let busy=false;
const storageKey='repowise.workspace.v1';
let workspace;
function read(){if(!workspace){const raw=localStorage.getItem(storageKey);workspace=raw?JSON.parse(raw):{mode:'demo',account:'Demo workspace',repos:demo()};}return workspace;}
function save(){localStorage.setItem(storageKey,JSON.stringify(workspace));}
export function setGithubToken(value){token=value.trim();}
async function github(path,method='GET',body){
 const response=await fetch('https://api.github.com'+path,{method,headers:{Accept:'application/vnd.github+json',...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
 if(!response.ok){const error=await response.json();throw Error('GitHub '+response.status+': '+error.message);}
 return response.status===204?{}:response.json();
}
export async function hostedApi(path,data){
 read();
 if(path==='state')return structuredClone({...workspace,connected:!!token});
 if(busy)throw Error('Another operation is in progress. Please wait.');
 busy=true;
 try{
 if(path==='sync'){
  if(!token&&!/^[a-zA-Z0-9-]{1,39}$/.test(data.username||''))throw Error('Enter a valid GitHub username.');
  const account=token?(await github('/user')).login:data.username;
  let repos=[];
  for(let page=1;;page++){const batch=await github(token?'/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator,organization_member&page='+page:'/users/'+account+'/repos?per_page=100&sort=pushed&page='+page);repos.push(...batch);if(batch.length<100)break;}
  const prior=new Map(workspace.mode==='github'?workspace.repos.map(r=>[r.id,r]):[]);
  repos=repos.map(r=>({...r,analysis:prior.get(r.id)?.pushed_at===r.pushed_at?prior.get(r.id).analysis:analyze(r),local:prior.get(r.id)?.local||{tags:[],notes:'',review:'Unreviewed',favorite:false}}));
  workspace={mode:'github',account,repos,syncedAt:new Date().toISOString()};
 }else if(path==='demo'){workspace={mode:'demo',account:'Demo workspace',repos:demo()};}
 else if(path==='local'){
  const r=workspace.repos.find(r=>r.id===data.id);if(!r)throw Error('Repository not found');
  const p=data.patch||{};
  for(const key of ['notes','review','status','projectType','cluster'])if(typeof p[key]==='string'&&p[key].length<20000)r.local[key]=p[key];
  if(Array.isArray(p.tags))r.local.tags=p.tags.filter(t=>typeof t==='string').slice(0,30);
  if(typeof p.favorite==='boolean')r.local.favorite=p.favorite;
 }else if(path==='analyze'){
  const r=workspace.repos.find(r=>r.id===data.id);if(!r)throw Error('Repository not found');
  if(workspace.mode==='github'){
   const base='/repos/'+r.full_name;
   const tree=await github(base+'/git/trees/'+encodeURIComponent(r.default_branch)+'?recursive=1');
   const files=tree.tree.filter(f=>f.type==='blob').map(f=>f.path);
   let contents='';
   for(const p of files.filter(p=>/(^|\/)(readme.md|package.json|pyproject.toml|requirements.txt|cmakelists.txt)$/i.test(p)).slice(0,5)){
    const file=await github(base+'/contents/'+p.split('/').map(encodeURIComponent).join('/'));
    if(file.content&&file.size<100000)contents+=new TextDecoder().decode(Uint8Array.from(atob(file.content.replace(/\s/g,'')),c=>c.charCodeAt(0))).slice(0,12000);
   }
   r.analysis=analyze(r,files.slice(0,5000),contents);r.analysis.treeTruncated=tree.truncated;
  }else r.analysis.analyzedAt=new Date().toISOString();
 }else if(path==='manage'){
  const actions=['archive','unarchive','public','private','delete','rename','description','topics'];
  if(!actions.includes(data.action))throw Error('Unsupported action');
  const targets=workspace.repos.filter(r=>(data.ids||[]).includes(r.id));
  if(!targets.length||targets.length!==data.ids.length)throw Error('Invalid selection');
  if(data.confirmation!==targets.map(r=>r.full_name).sort().join(','))throw Error('Explicit confirmation required');
  if(data.action==='delete'&&(targets.length!==1||data.typedName!==targets[0].name))throw Error('Type the repository name to delete it');
  if(workspace.mode==='github'&&!token)throw Error('Add a GitHub token in Settings to manage repositories.');
  let completed=0;
  for(const r of targets){
   try{
    const action=data.action;
    if(action==='rename'&&!/^[\w.-]{1,100}$/.test(data.value||''))throw Error('Invalid repository name');
    const patch=action==='archive'?{archived:true}:action==='unarchive'?{archived:false}:action==='public'?{private:false}:action==='private'?{private:true}:action==='rename'?{name:data.value}:action==='description'?{description:data.value}:{};
    const topics=action==='topics'?String(data.value).split(',').map(s=>s.trim()).filter(Boolean):undefined;
    if(workspace.mode==='github')await github('/repos/'+r.full_name+(action==='topics'?'/topics':''),action==='delete'?'DELETE':action==='topics'?'PUT':'PATCH',action==='delete'?undefined:action==='topics'?{names:topics}:patch);
    if(action==='delete')workspace.repos=workspace.repos.filter(x=>x.id!==r.id);
    else{
     Object.assign(r,patch);
     if(action==='rename'){r.full_name=r.owner.login+'/'+r.name;r.html_url='https://github.com/'+r.full_name;}
     if(topics)r.topics=topics;
     if(action==='archive'){r.analysis.status='Archived';r.analysis.recommendation='Keep';r.analysis.recommendationReason='Already archived; retain it as a reference.';}
     if(action==='unarchive')r.analysis.status='Paused';
    }
    save();completed++;
   }catch(error){throw Error(completed+' of '+targets.length+' completed. '+error.message);}
  }
 }else throw Error('Unknown operation');
 save();return {ok:true};
 }finally{busy=false;}
}

