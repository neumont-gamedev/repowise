import {setGithubToken} from './hosted-api.js';
export function mountHostedSettings({refresh,toast}) {
 const settings=document.querySelector('.settings');if(!settings)return;
 const section=document.createElement('section');
 section.innerHTML='<h2>GitHub access for this session</h2><p>Public repositories only need a username below. For private repositories and management actions, add a GitHub personal access token with access to those repositories. It is held in memory and sent only to api.github.com. Reloading or closing this page clears it.</p><label>GitHub token<input id="session-token" type="password" autocomplete="off" placeholder="Optional for public repositories"></label><div class="management"><button class="button" id="use-token">Use token</button><button class="button" id="clear-token">Clear token</button></div><hr>';
 settings.prepend(section);
 section.onclick=async e=>{
  const b=e.target.closest('button');if(!b)return;e.stopPropagation();
  if(b.id==='use-token'){setGithubToken(section.querySelector('#session-token').value);section.querySelector('#session-token').value='';}
  else if(b.id==='clear-token')setGithubToken('');
  else return;
  await refresh();toast(b.id==='clear-token'?'GitHub token cleared':'GitHub token set for this page session');
 };
}

