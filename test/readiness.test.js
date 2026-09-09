import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeReadiness,readinessSummary} from '../public/readiness.js';
test('readiness respects unfinished tasks, not applicable areas and unknown projects',()=>{
 assert.equal(readinessSummary().label,'Readiness not assessed');
 const data=normalizeReadiness({UI:{status:'Ready',tasks:[{text:' Mobile layout ',done:false}]},Features:{status:'Ready'},Testing:{status:'Not applicable',tasks:[{text:'Ignored'}]},Release:{status:'Ready'}});
 assert.equal(data.UI.tasks[0].text,'Mobile layout');assert.equal(readinessSummary(data).remaining,1);assert.equal(readinessSummary(data).next,'UI');
 data.UI.tasks[0].done=true;assert.equal(readinessSummary(data).label,'Ready across all areas');
 data.Release.status='In progress';assert.equal(readinessSummary(data).next,'Release');
 assert.equal(normalizeReadiness({UI:{status:'invalid',tasks:[null,{text:''}]}}).UI.tasks.length,0);
});
test('hosted readiness annotations persist across workspace reloads',async()=>{
 const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 try{const {hostedApi}=await import('../dist/hosted-api.js?readiness-test');const repo=(await hostedApi('state')).repos[0];await hostedApi('local',{id:repo.id,patch:{readiness:{Testing:{status:'In progress',tasks:[{text:'Verify login',done:false}]}}}});const {hostedApi:reload}=await import('../dist/hosted-api.js?readiness-reload');const saved=(await reload('state')).repos.find(r=>r.id===repo.id);assert.equal(saved.local.readiness.Testing.tasks[0].text,'Verify login');assert.equal(readinessSummary(saved.local.readiness).remaining,1);}finally{delete globalThis.localStorage;}
});
