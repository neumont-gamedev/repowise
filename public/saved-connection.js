import {connect} from './firebase.js';
import {setSavedGithubConnection,setGithubToken} from './hosted-api.js';
let lastUid,checkedAt=0,cached={connected:false},pending;
export async function accountRequest(path,method='GET',body){
 const c=await connect(),user=c.auth.currentUser;
 if(!user)throw Error('Sign in with Google first.');
 const response=await fetch(path,{method,headers:{Authorization:'Bearer '+await user.getIdToken(),'Content-Type':'application/json'},body:method==='GET'?undefined:JSON.stringify(body||{})});
 const result=await response.json();
 if(!response.ok)throw Error(result.error||'Saved connection request failed');
 return result;
}
export async function initializeSavedConnection(force=false){
 const c=await connect(),uid=c.auth.currentUser?.uid||null;
 if(uid!==lastUid){lastUid=uid;cached={connected:false};checkedAt=0;setSavedGithubConnection(false,null,uid);}
 if(!uid){setSavedGithubConnection(false,null,null);return {signedIn:false,connected:false};}
 if(force||Date.now()-checkedAt>15000){
  if(!pending)pending=accountRequest('/api/connection').then(value=>{if(c.auth.currentUser?.uid===uid){cached=value;checkedAt=Date.now();}return value;}).finally(()=>{pending=null;});
  await pending;
 }
 if(c.auth.currentUser?.uid!==uid)return {signedIn:false,connected:false};
 setSavedGithubConnection(cached.connected,async(path,method,body,confirmation)=> (await accountRequest('/api/github','POST',{path,method,body,...confirmation})).data,uid);
 return {...cached,signedIn:true};
}
export async function saveConnection(token){
 const result=await accountRequest('/api/connection','PUT',{token:token.trim()});
 setGithubToken('');checkedAt=0;await initializeSavedConnection(true);return result;
}
export async function disconnectConnection(){
 await accountRequest('/api/connection','DELETE');setGithubToken('');checkedAt=0;await initializeSavedConnection(true);
}

