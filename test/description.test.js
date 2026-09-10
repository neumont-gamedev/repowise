import test from 'node:test';
import assert from 'node:assert/strict';
test('description edits refresh the saved summary, including clearing the description',async()=>{
 const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 try{const {hostedApi}=await import('../dist/hosted-api.js?description-test');const repo=(await hostedApi('state')).repos[0];
 for(const value of ['New project description','']){await hostedApi('manage',{ids:[repo.id],action:'description',value,confirmation:repo.full_name});const updated=(await hostedApi('state')).repos.find(r=>r.id===repo.id);assert.equal(updated.description,value);assert.equal(updated.analysis.summary,value||`${repo.language||'Software'} project. Inspect its files to establish its purpose.`);}
 }finally{delete globalThis.localStorage;}
});
