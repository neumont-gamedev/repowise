import config from './firebase-config.js';
let connection;
export async function connect() {
 if(!connection)connection=(async()=>{
  const [app,authSdk,store]=await Promise.all([
   import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
   import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
   import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')
  ]);
  const instance=app.initializeApp(config),auth=authSdk.getAuth(instance);
  await auth.authStateReady();
  return {auth,authSdk,store,db:store.getFirestore(instance)};
 })().catch(e=>{connection=null;throw e;});
 return connection;
}
export function mountFirebase({state,api,refresh,toast}) {
 const settings=document.querySelector('.settings');if(!settings)return;
 const section=document.createElement('section');
 section.innerHTML='<h2>Firebase cloud workspace</h2><p>Project: <strong>repowise-neumont</strong>. Sign in with Google to back up notes, tags, favorites, and review decisions to your private Firestore workspace.</p><p id="cloud-status" role="status">Not connected</p><div class="management"><button class="button primary" id="cloud-login">Sign in with Google</button><button class="button" id="cloud-upload" disabled>Back up annotations</button><button class="button" id="cloud-restore" disabled>Restore annotations</button><button class="button" id="cloud-logout" disabled>Sign out</button></div><p class="muted">Backups include repository names and annotations. GitHub tokens are separate from annotation backups. Back up again after changes. Demo data cannot be backed up.</p><hr>';
 settings.prepend(section);
 const message=section.querySelector('#cloud-status'),buttons=[...section.querySelectorAll('button')];
 function paint(c){
  if(!section.isConnected)return;
  const user=c?.auth.currentUser;
  message.textContent=user?'Signed in as '+(user.email||user.uid):'Not connected';
  section.querySelector('#cloud-login').disabled=!!user;
  section.querySelector('#cloud-logout').disabled=!user;
  section.querySelector('#cloud-upload').disabled=!user||state.mode==='demo';
  section.querySelector('#cloud-restore').disabled=!user||state.mode==='demo';
 }
 section.onclick=async event=>{
  const button=event.target.closest('button');if(!button)return;
  buttons.forEach(b=>b.disabled=true);let c;
  try{
   c=await connect();
   if(button.id==='cloud-login'){
    await c.authSdk.setPersistence(c.auth,c.authSdk.browserSessionPersistence);
    await c.authSdk.signInWithPopup(c.auth,new c.authSdk.GoogleAuthProvider());
   await refresh();
   }else if(button.id==='cloud-logout'){await c.authSdk.signOut(c.auth);await refresh();}
   else{
    const uid=c.auth.currentUser?.uid;
    if(!uid)throw Error('Sign in before accessing cloud annotations.');
    if(state.mode==='demo')throw Error('Connect GitHub before using cloud backups.');
    if(button.id==='cloud-upload'){
     for(let start=0;start<state.repos.length;start+=400){
      const batch=c.store.writeBatch(c.db);
      for(const r of state.repos.slice(start,start+400))batch.set(c.store.doc(c.db,'users',uid,'repositories',String(r.id)),{fullName:r.full_name,annotations:r.local,updatedAt:c.store.serverTimestamp()});
      await batch.commit();
      message.textContent='Backed up '+Math.min(start+400,state.repos.length)+' of '+state.repos.length+' repositories';
     }
     toast('Annotations backed up to Firebase');
    }else if(button.id==='cloud-restore'){
     const snapshots=await c.store.getDocs(c.store.collection(c.db,'users',uid,'repositories'));
     const current=new Map(state.repos.map(r=>[String(r.id),r]));
     const matching=snapshots.docs.filter(d=>current.has(d.id));
     if(!matching.length)throw Error('No cloud annotations match this workspace.');
     if(!window.confirm('Replace local annotations for '+matching.length+' repositories with your Firebase backup? Export your workspace first to preserve the current notes.'))return;
     let restored=0;
     for(const snapshot of matching){await api('local',{id:current.get(snapshot.id).id,patch:snapshot.data().annotations});message.textContent='Restored '+(++restored)+' of '+matching.length;}
     await refresh();toast('Annotations restored from Firebase');
    }
   }
  }catch(error){toast('Firebase: '+error.message);}finally{paint(c);}
 };
 message.textContent='Connecting to Firebase…';
 buttons.forEach(b=>b.disabled=true);
 connect().then(paint).catch(error=>{paint();message.textContent='Firebase unavailable: '+error.message;});
}

