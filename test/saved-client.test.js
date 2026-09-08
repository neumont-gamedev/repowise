import test from 'node:test';
import assert from 'node:assert/strict';
test('hosted saved connection uses backend and switches local workspaces with Firebase users',async()=>{
 const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 const {hostedApi,setSavedGithubConnection}=await import('../dist/hosted-api.js?saved-test');
 const original=globalThis.fetch;globalThis.fetch=async()=>{throw Error('Browser must not send saved GitHub credentials directly');};
 const calls=[];
 const proxy=async(path,method,body,confirmation)=>{calls.push({path,method,body,confirmation});return path==='/user'?{login:'owner'}:method==='GET'?[{id:42,name:'private',full_name:'owner/private',owner:{login:'owner'},private:true,pushed_at:new Date().toISOString()}]:{};};
 try{
  setSavedGithubConnection(true,proxy,'firebase-a');
  await hostedApi('sync',{username:''});
  assert.equal((await hostedApi('state')).syncInfo.privateCount,1);
  await hostedApi('local',{id:42,patch:{notes:'Only A sees this workspace'}});
  await hostedApi('manage',{ids:[42],action:'archive',confirmation:'owner/private'});
  assert.equal(calls.at(-1).confirmation.confirmation,'owner/private');
  setSavedGithubConnection(false,null,'firebase-b');
  assert.equal((await hostedApi('state')).mode,'demo');
  setSavedGithubConnection(true,proxy,'firebase-a');
  assert.equal((await hostedApi('state')).repos[0].local.notes,'Only A sees this workspace');
  setSavedGithubConnection(false,null,null);
  assert.equal((await hostedApi('state')).connected,false);
 }finally{globalThis.fetch=original;delete globalThis.localStorage;}
});

