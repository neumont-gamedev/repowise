import {setGithubToken} from './hosted-api.js';
import {initializeSavedConnection,saveConnection,disconnectConnection} from './saved-connection.js';
export function mountHostedSettings({state,refresh,toast}) {
 const settings=document.querySelector('.settings');if(!settings)return;
 const section=document.createElement('section');
 section.innerHTML='<h2>Your GitHub connection</h2><p>Sign in with Google below to save a GitHub token to your account. Saved tokens are encrypted on the server and used by the protected GitHub service. You can replace or disconnect them anytime.</p><p id="connection-status" role="status">Checking saved connection…</p><label>GitHub personal access token<input id="session-token" type="password" autocomplete="off" placeholder="Paste a token to save or replace"></label><div class="management"><button class="button primary" id="save-connection" disabled>Save connection</button><button class="button" id="disconnect-connection" disabled>Disconnect</button><button class="button" id="use-token">Use for this session only</button><button class="button" id="clear-token">Clear session token</button></div><p class="muted">Session-only tokens are cleared on reload. Disconnect removes the saved connection from Repowise; revoke the token in GitHub if you also want to invalidate it there.</p><hr>';
 settings.prepend(section);
 const status=section.querySelector('#connection-status');
 initializeSavedConnection().then(value=>{
  if(!section.isConnected)return;
  status.textContent=value.connected?'Saved connection: '+value.login:value.signedIn?'Signed in. No saved GitHub connection.':'Sign in with Google to save your connection.';
  section.querySelector('#save-connection').disabled=!value.signedIn;
  section.querySelector('#save-connection').textContent=value.connected?'Replace token':'Save connection';
  section.querySelector('#disconnect-connection').disabled=!value.connected;
 }).catch(e=>{status.textContent=e.message;});
 if(state.syncInfo){const info=document.createElement('p');info.textContent='Last sync: '+(state.syncInfo.authenticated?'authenticated':'public access only')+' · '+state.syncInfo.total+' repositories · '+state.syncInfo.privateCount+' private.';section.append(info);}
 section.onclick=async e=>{
  const b=e.target.closest('button');if(!b)return;e.stopPropagation();
  const value=section.querySelector('#session-token').value.trim();
  b.disabled=true;
  try{
   if(b.id==='save-connection'){if(!value)throw Error('Paste a GitHub token first.');await saveConnection(value);toast('GitHub connection saved to your account');}
   else if(b.id==='disconnect-connection'){await disconnectConnection();toast('Saved GitHub connection removed');}
   else if(b.id==='use-token'){if(!value)throw Error('Paste a GitHub token first.');setGithubToken(value);toast('GitHub token set for this session only');}
   else if(b.id==='clear-token'){setGithubToken('');toast('Session token cleared');}
   else return;
   section.querySelector('#session-token').value='';await refresh();
  }catch(error){toast(error.message);b.disabled=false;}
 };
}

