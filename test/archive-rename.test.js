import test from 'node:test';
import assert from 'node:assert/strict';
test('rename and archive sends one confirmed update and preserves state on failure',async()=>{
 const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 const {hostedApi,setSavedGithubConnection}=await import('../dist/hosted-api.js?archive-rename');
 const calls=[];let fail=false;
 const proxy=async(path,method,body,confirmation)=>{
  if(method==='GET')return path==='/user'?{login:'owner'}:['project','taken'].map((name,i)=>({id:i+41,name,full_name:'owner/'+name,owner:{login:'owner'},archived:false,pushed_at:new Date().toISOString()}));
  calls.push({path,method,body,confirmation});if(fail)throw Error('Name conflict');return {};
 };
 try{
  setSavedGithubConnection(true,proxy,'archive-user');await hostedApi('sync',{username:''});
  await hostedApi('local',{id:41,patch:{notes:'Keep history',favorite:true}});
  const action={ids:[41],action:'archive',confirmation:'owner/project'};
  for(const archiveName of ['bad/name','..','TAKEN'])await assert.rejects(hostedApi('manage',{...action,archiveName}));
  await assert.rejects(hostedApi('manage',{...action,ids:[41,42],confirmation:'owner/project,owner/taken',archiveName:'new'}),/single repository/);
  assert.equal(calls.length,0);
  fail=true;await assert.rejects(hostedApi('manage',{...action,archiveName:'project-archived'}),/Name conflict/);
  let repo=(await hostedApi('state')).repos.find(r=>r.id===41);assert.equal(repo.name,'project');assert.equal(repo.archived,false);
  fail=false;await hostedApi('manage',{...action,archiveName:' project-archived '});
  assert.deepEqual(calls.at(-1),{path:'/repos/owner/project',method:'PATCH',body:{archived:true,name:'project-archived'},confirmation:{confirmation:'owner/project',typedName:undefined}});
  repo=(await hostedApi('state')).repos.find(r=>r.id===41);
  assert.equal(repo.full_name,'owner/project-archived');assert.equal(repo.html_url,'https://github.com/owner/project-archived');assert.equal(repo.archived,true);assert.equal(repo.local.notes,'Keep history');assert.equal(repo.local.favorite,true);
  await hostedApi('manage',{ids:[42],action:'archive',confirmation:'owner/taken',archiveName:' '});assert.deepEqual(calls.at(-1).body,{archived:true});
 }finally{delete globalThis.localStorage;}
});
