import test from 'node:test';
import assert from 'node:assert/strict';
test('hosted workspace persists annotations and guards management without exposing tokens',async()=>{
 const storage=new Map();
 globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 const {hostedApi,setGithubToken}=await import('../dist/hosted-api.js');
 const state=await hostedApi('state');
 assert.equal(state.repos.length,12);
 await hostedApi('local',{id:1,patch:{notes:'Hosted test',favorite:true}});
 assert.match(storage.get('repowise.workspace.v1'),/Hosted test/);
 await assert.rejects(hostedApi('manage',{ids:[1],action:'delete'}),/confirmation/);
 await assert.rejects(hostedApi('manage',{ids:[1],action:'delete',confirmation:state.repos[0].full_name,typedName:'wrong'}),/repository name/);
 setGithubToken('test-only-token');
 assert.equal((await hostedApi('state')).connected,true);
 assert.ok(!storage.get('repowise.workspace.v1').includes('test-only-token'));
 setGithubToken('');
 await hostedApi('manage',{ids:[1],action:'archive',confirmation:state.repos[0].full_name});
 assert.equal((await hostedApi('state')).repos[0].archived,true);
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async()=>({ok:true,status:200,json:async()=>[{id:42,name:'public-project',full_name:'example/public-project',owner:{login:'example'},description:'Example',language:'JavaScript',pushed_at:new Date().toISOString(),created_at:new Date().toISOString(),topics:[]}]});
 try{
  await hostedApi('sync',{username:'example'});
  assert.equal((await hostedApi('state')).repos[0].id,42);
  await assert.rejects(hostedApi('manage',{ids:[42],action:'archive',confirmation:'example/public-project'}),/token/);
 }finally{globalThis.fetch=originalFetch;delete globalThis.localStorage;}
});

