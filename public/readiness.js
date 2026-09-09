export const areas=['UI','Features','Testing','Release'];
export const statuses=['Not started','In progress','Ready','Not applicable'];
export function normalizeReadiness(value={}){
 return Object.fromEntries(areas.map(area=>{const data=value?.[area]||{};return [area,{status:statuses.includes(data.status)?data.status:'Not started',tasks:(Array.isArray(data.tasks)?data.tasks:[]).filter(t=>t&&typeof t.text==='string'&&t.text.trim()).slice(0,50).map(t=>({text:t.text.trim().slice(0,500),done:t.done===true}))}];}));
}
export function readinessSummary(value){
 if(!value)return {label:'Readiness not assessed',remaining:0,next:null};
 const data=normalizeReadiness(value);const applicable=areas.filter(a=>data[a].status!=='Not applicable');
 const remaining=applicable.reduce((n,a)=>n+data[a].tasks.filter(t=>!t.done).length,0);
 const next=applicable.find(a=>data[a].status!=='Ready'||data[a].tasks.some(t=>!t.done));
 return {remaining,next,label:!applicable.length?'No applicable readiness areas':next?(remaining+' task'+(remaining===1?'':'s')+' remaining · Next: '+next):'Ready across all areas'};
}
export function readinessEditor(value,esc){const data=normalizeReadiness(value);return '<section class="readiness-section"><h3>Project readiness</h3><p>Your checklist of remaining work. These are your assessments, not automatic analysis. Not applicable areas are excluded from progress.</p><div class="readiness-grid">'+areas.map((area,i)=>'<section class="readiness-area" data-area="'+area+'"><h4>'+area+'</h4><label>Readiness status<select data-readiness-status>'+statuses.map(status=>'<option '+(status===data[area].status?'selected':'')+'>'+status+'</option>').join('')+'</select></label><div class="readiness-tasks">'+data[area].tasks.map(t=>taskRow(t,esc)).join('')+'</div><button type="button" class="text-button" data-add-task="'+i+'">+ Add task</button></section>').join('')+'</div><p class="muted">Use Save your changes to save readiness with your notes and preferences.</p></section>';}
export function taskRow(task,esc){return '<div class="readiness-task"><input type="checkbox" aria-label="Task completed" '+(task.done?'checked':'')+'><input type="text" aria-label="Task description" maxlength="500" placeholder="What remains to be done?" value="'+esc(task.text)+'"><button type="button" class="icon" data-remove-task aria-label="Remove task">×</button></div>';}
export function readReadiness(root){return normalizeReadiness(Object.fromEntries([...root.querySelectorAll('[data-area]')].map(el=>[el.dataset.area,{status:el.querySelector('[data-readiness-status]').value,tasks:[...el.querySelectorAll('.readiness-task')].map(row=>({text:row.querySelector('input[type=text]').value,done:row.querySelector('input[type=checkbox]').checked}))}])));}
