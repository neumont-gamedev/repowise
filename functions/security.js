import {createCipheriv,createDecipheriv,randomBytes,createHash} from 'node:crypto';
export const connectionId=uid=>createHash('sha256').update(uid).digest('hex');
export function encryptToken(token,uid,key){
 const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',Buffer.from(key,'base64'),iv);
 cipher.setAAD(Buffer.from(uid));
 const encrypted=Buffer.concat([cipher.update(token,'utf8'),cipher.final()]);
 return {v:1,iv:iv.toString('base64'),ciphertext:encrypted.toString('base64'),tag:cipher.getAuthTag().toString('base64')};
}
export function decryptToken(value,uid,key){
 const decipher=createDecipheriv('aes-256-gcm',Buffer.from(key,'base64'),Buffer.from(value.iv,'base64'));
 decipher.setAAD(Buffer.from(uid));decipher.setAuthTag(Buffer.from(value.tag,'base64'));
 return Buffer.concat([decipher.update(Buffer.from(value.ciphertext,'base64')),decipher.final()]).toString('utf8');
}
export function validateGithubRequest(input){
 const {path,method='GET',body,confirmation,typedName}=input||{};
 if(typeof path!=='string'||path.length>3000||!path.startsWith('/')||path.startsWith('//')||/[\\#]/.test(path))throw Error('Invalid GitHub path');
 let decoded;try{decoded=decodeURIComponent(path.split('?')[0]);}catch{throw Error('Invalid GitHub path');}
 if(decoded.split('/').some(p=>p==='.'||p==='..'))throw Error('Invalid GitHub path');
 const url=new URL(path,'https://api.github.com');
 if(url.origin!=='https://api.github.com')throw Error('Invalid GitHub host');
 const name='[A-Za-z0-9_.-]+';
 const repo=new RegExp('^/repos/('+name+')/('+name+')$').exec(url.pathname);
 const topics=new RegExp('^/repos/('+name+')/('+name+')/topics$').exec(url.pathname);
 const read= url.pathname==='/user'||url.pathname==='/user/repos'||
  new RegExp('^/(users|orgs)/'+name+'/repos$').test(url.pathname)||
  new RegExp('^/repos/'+name+'/'+name+'(/git/trees/[^/]+|/contents/.+)?$').test(url.pathname);
 if(method==='GET'){if(!read)throw Error('Unsupported GitHub operation');return {path:url.pathname+url.search,method};}
 const target=repo||topics;
 if(!target||confirmation!==target[1]+'/'+target[2])throw Error('Repository confirmation required');
 if(method==='DELETE'&&repo){if(typedName!==target[2])throw Error('Type the repository name to delete it');return {path:url.pathname,method};}
 if(method==='PUT'&&topics){
  if(!Array.isArray(body?.names)||body.names.length>20||body.names.some(t=>typeof t!=='string'||!/^[a-z0-9-]{1,50}$/.test(t)))throw Error('Invalid topics');
  return {path:url.pathname,method,body:{names:body.names}};
 }
 if(method==='PATCH'&&repo){
  const allowed=['name','description','private','archived'];
  if(!body||typeof body!=='object'||Array.isArray(body)||!Object.keys(body).length||Object.keys(body).some(k=>!allowed.includes(k)))throw Error('Unsupported repository update');
  if('name'in body&&!/^[\w.-]{1,100}$/.test(body.name))throw Error('Invalid name');
  if('description'in body&&(typeof body.description!=='string'||body.description.length>1000))throw Error('Invalid description');
  for(const k of ['private','archived'])if(k in body&&typeof body[k]!=='boolean')throw Error('Invalid repository update');
  return {path:url.pathname,method,body};
 }
 throw Error('Unsupported GitHub operation');
}

