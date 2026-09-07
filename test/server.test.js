import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
test('API persists local decisions and enforces GitHub action confirmations',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'repowise-test-'));
 const port=String(32000+Math.floor(Math.random()*15000));
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:port,DATA_DIR:dir,GITHUB_TOKEN:''},stdio:['ignore','pipe','pipe']});
 try{
 await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error('Server failed to start');}),new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('Startup timeout')),10000);timer.unref();})]);
 const request=async(path,data,headers={})=>{const r=await fetch(`http://localhost:${port}/api/${path}`,data?{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)}:{});return {status:r.status,body:await r.json()};};
 const initial=(await request('state')).body;assert.equal(initial.mode,'demo');assert.equal(initial.repos.length,12);
 assert.equal((await request('local',{id:1,patch:{notes:'Remember physics demo',review:'Keep'}})).status,200);
 assert.equal(JSON.parse(await readFile(join(dir,'state.json'),'utf8')).repos[0].local.notes,'Remember physics demo');
 assert.equal((await request('manage',{ids:[1],action:'archive'})).status,400);
 assert.equal((await request('state')).body.repos[0].archived,false);
 assert.equal((await request('manage',{ids:[1],action:'archive',confirmation:initial.repos[0].full_name},{Origin:'https://evil.example'})).status,403);
 assert.equal((await request('manage',{ids:[1],action:'archive',confirmation:initial.repos[0].full_name})).status,200);
 assert.equal((await request('state')).body.repos[0].archived,true);
 assert.equal((await request('manage',{ids:[1],action:'delete',confirmation:initial.repos[0].full_name,typedName:'wrong'})).status,400);
 assert.equal((await request('state')).body.repos.length,12);
 assert.equal((await request('manage',{ids:[1],action:'delete',confirmation:initial.repos[0].full_name,typedName:initial.repos[0].name})).status,200);
 assert.equal((await request('state')).body.repos.length,11);
 }finally{child.kill();await once(child,'exit');await rm(dir,{recursive:true,force:true});}
});
