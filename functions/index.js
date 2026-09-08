import {onRequest} from 'firebase-functions/v2/https';
import {defineSecret} from 'firebase-functions/params';
import {initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {createHandler} from './handler.js';
initializeApp();
const encryptionKey=defineSecret('GITHUB_TOKEN_ENCRYPTION_KEY');
const handler=createHandler({
 verifyUser:token=>getAuth().verifyIdToken(token,true),
 db:getFirestore(),key:()=>encryptionKey.value(),
 fetchGithub:async(path,token,method='GET',body)=>{
  const response=await fetch('https://api.github.com'+path,{method,redirect:'error',headers:{Accept:'application/vnd.github+json','User-Agent':'Repowise','Authorization':'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(25000)});
  const data=response.status===204?{}:await response.json();
  return {ok:response.ok,status:response.status,data};
 }
});
export const accountApi=onRequest({region:'us-central1',timeoutSeconds:60,memory:'256MiB',minInstances:0,maxInstances:2,concurrency:20,secrets:[encryptionKey]},handler);

