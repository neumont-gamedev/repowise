import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {encryptToken,decryptToken,validateGithubRequest} from '../functions/security.js';
import {createHandler} from '../functions/handler.js';
test('saved token encryption is authenticated and bound to a Firebase user',()=>{
 const key=randomBytes(32).toString('base64'),token='test-private-token-value';
 const encrypted=encryptToken(token,'user-a',key);
 assert.ok(!JSON.stringify(encrypted).includes(token));
 assert.equal(decryptToken(encrypted,'user-a',key),token);
 assert.throws(()=>decryptToken(encrypted,'user-b',key));
 assert.throws(()=>decryptToken({...encrypted,tag:randomBytes(16).toString('base64')},'user-a',key));
});
test('GitHub proxy rejects arbitrary destinations and unconfirmed or unrelated writes',()=>{
 for(const path of ['https://example.com/','//example.com/','/repos/a/b/../../user','/repos/a/b/%2e%2e/secrets','/user/emails','/repos/a/b/actions/secrets'])assert.throws(()=>validateGithubRequest({path}));
 assert.deepEqual(validateGithubRequest({path:'/user/repos?per_page=100&page=2'}),{path:'/user/repos?per_page=100&page=2',method:'GET'});
 assert.throws(()=>validateGithubRequest({path:'/repos/a/b',method:'DELETE',confirmation:'a/b',typedName:'wrong'}));
 assert.throws(()=>validateGithubRequest({path:'/repos/a/b',method:'PATCH',confirmation:'a/b',body:{allow_auto_merge:true}}));
 assert.deepEqual(validateGithubRequest({path:'/repos/a/b',method:'DELETE',confirmation:'a/b',typedName:'b'}),{path:'/repos/a/b',method:'DELETE'});
});
test('account backend isolates users, encrypts stored tokens, and never returns credentials',async()=>{
 const records=new Map(),key=randomBytes(32).toString('base64'),calls=[];
 const doc=name=>({get:async()=>({data:()=>records.get(name)}),set:async value=>{records.set(name,value);},delete:async()=>records.delete(name),name});
 const db={collection:name=>({doc:id=>doc(name+'/'+id)}),runTransaction:async fn=>fn({get:ref=>ref.get(),set:(ref,value)=>{records.set(ref.name,value);}})};
 const handler=createHandler({db,key:()=>key,verifyUser:async bearer=>{if(!['user-a','user-b'].includes(bearer))throw Error('invalid');return {uid:bearer,email_verified:true};},fetchGithub:async(path,token,method)=>{calls.push({path,token,method});return {ok:true,status:200,data:path==='/user'?{login:'github-user'}:[{name:'private-repo',private:true}]};}});
 async function request(user,method,path,body={},origin='https://repowise.web.app'){
  const result={code:200,body:null};
  const res={set(){return this;},status(n){result.code=n;return this;},json(data){result.body=data;return this;}};
  await handler({method,path,body,headers:{...(user?{authorization:'Bearer '+user}:{}),origin},is:()=>true},res);
  return result;
 }
 assert.equal((await request(null,'GET','/api/connection')).code,401);
 assert.equal((await request('invalid','GET','/api/connection')).code,401);
 assert.equal((await request('user-a','PUT','/api/connection',{token:'test-token-for-user-a-123456'},'https://evil.example')).code,403);
 assert.equal((await request('user-a','PUT','/api/connection',{token:'test-token-for-user-a-123456'})).code,200);
 assert.ok(!JSON.stringify([...records.values()]).includes('test-token-for-user-a-123456'));
 const info=await request('user-a','GET','/api/connection');
 assert.equal(info.body.connected,true);assert.ok(!JSON.stringify(info).includes('ciphertext'));assert.ok(!JSON.stringify(info).includes('test-token'));
 assert.equal((await request('user-b','GET','/api/connection')).body.connected,false);
 assert.equal((await request('user-b','POST','/api/github',{path:'/user/repos'})).code,409);
 const result=await request('user-a','POST','/api/github',{path:'/user/repos'});
 assert.equal(result.body.data[0].private,true);assert.equal(calls.at(-1).token,'test-token-for-user-a-123456');
 const before=calls.length;
 assert.equal((await request('user-a','POST','/api/github',{path:'//evil.example'})).code,400);assert.equal(calls.length,before);
 await request('user-b','DELETE','/api/connection');
 assert.equal((await request('user-a','GET','/api/connection')).body.connected,true);
 await request('user-a','DELETE','/api/connection');
 assert.equal((await request('user-a','GET','/api/connection')).body.connected,false);
 assert.equal((await request('user-a','POST','/api/github',{path:'/user/repos'})).code,409);
});

