import {connectionId,encryptToken,decryptToken,validateGithubRequest} from './security.js';
export function createHandler({verifyUser,db,key,fetchGithub,now=()=>Date.now()}){
 return async(req,res)=>{
  res.set('Cache-Control','no-store');res.set('X-Content-Type-Options','nosniff');
  const allowed=['https://repowise.web.app','https://repowise.firebaseapp.com'];
  if(req.headers.origin&&!allowed.includes(req.headers.origin))return res.status(403).json({error:'Origin not allowed'});
  const header=req.headers.authorization||'';
  if(!header.startsWith('Bearer '))return res.status(401).json({error:'Sign in with Google to use a saved connection.'});
  let user;
  try{user=await verifyUser(header.slice(7));}catch{return res.status(401).json({error:'Your sign-in expired. Sign in again.'});}
  if(!user?.uid||!user.email_verified)return res.status(403).json({error:'A verified account is required.'});
  const id=connectionId(user.uid),ref=db.collection('_githubConnections').doc(id);
  try{
   if(req.method!=='GET'&&!req.is('application/json'))return res.status(415).json({error:'JSON required'});
   if(req.rawBody?.length>20000)return res.status(413).json({error:'Request too large'});
   const rate=db.collection('_githubLimits').doc(id);
   const accepted=await db.runTransaction(async tx=>{
    const old=(await tx.get(rate)).data(),time=now(),fresh=!old||time-old.start>=300000;
    if(!fresh&&old.count>=600)return false;
    tx.set(rate,{start:fresh?time:old.start,count:fresh?1:old.count+1});return true;
   });
   if(!accepted)return res.status(429).json({error:'Too many requests. Try again in a few minutes.'});
   const path=req.path;
   if(path==='/api/connection'){
    if(req.method==='GET'){const saved=(await ref.get()).data();return res.json({connected:!!saved,login:saved?.login||null,updatedAt:saved?.updatedAt||null});}
    if(req.method==='PUT'){
     const token=req.body?.token;
     if(typeof token!=='string'||token.length<20||token.length>500||/\s/.test(token))return res.status(400).json({error:'Enter a valid GitHub personal access token.'});
     const account=await fetchGithub('/user',token);
     if(!account.ok)return res.status(400).json({error:'GitHub could not validate this token. Check its value, expiration, and approval status.'});
     const login=account.data.login;
     if(typeof login!=='string')throw Error('Invalid GitHub response');
     await ref.set({encrypted:encryptToken(token,user.uid,key()),login,updatedAt:new Date(now()).toISOString()});
     return res.json({connected:true,login});
    }
    if(req.method==='DELETE'){await ref.delete();return res.json({connected:false});}
    return res.status(405).json({error:'Method not allowed'});
   }
   if(path==='/api/github'&&req.method==='POST'){
    let request;try{request=validateGithubRequest(req.body);}catch(e){return res.status(400).json({error:e.message});}
    const saved=(await ref.get()).data();if(!saved)return res.status(409).json({error:'Save a GitHub connection in Settings first.'});
    const token=decryptToken(saved.encrypted,user.uid,key());
    const result=await fetchGithub(request.path,token,request.method,request.body);
    if(!result.ok)return res.status(result.status===401?409:result.status===403?403:400).json({error:result.status===401?'The saved GitHub token expired or was revoked. Replace it in Settings.':'GitHub returned '+result.status+'. Check repository access, organization approval, and rate limits.'});
    return res.json({data:result.data});
   }
   return res.status(404).json({error:'Unknown endpoint'});
  }catch{return res.status(500).json({error:'The saved connection service is temporarily unavailable. Please try again.'});}
 };
}

