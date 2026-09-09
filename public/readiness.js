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
export function readinessEditor(value,esc){
 const data=normalizeReadiness(value);
 return '<section class="readiness-section"><h3>Project readiness</h3><p>Choose one status per area. Save your changes to keep your selections.</p><div class="readiness-matrix-wrap"><table class="readiness-matrix"><caption class="sr-only">Project readiness status by category</caption><thead><tr><th scope="col">Area</th>'+statuses.map(status=>'<th scope="col">'+status+'</th>').join('')+'</tr></thead><tbody>'+areas.map((area,i)=>'<tr><th scope="row">'+area+'</th>'+statuses.map(status=>'<td><label class="readiness-choice"><input type="radio" name="readiness-status-'+i+'" data-status-area="'+area+'" value="'+status+'" aria-label="'+area+': '+status+'" '+(status===data[area].status?'checked':'')+'><span aria-hidden="true"></span></label></td>').join('')+'</tr>').join('')+'</tbody></table></div><details class="readiness-checklists"><summary>Task checklists ('+areas.reduce((n,a)=>n+data[a].tasks.length,0)+')</summary><div class="readiness-grid">'+areas.map((area,i)=>'<section class="readiness-area" data-area="'+area+'"><h4>'+area+'</h4><div class="readiness-tasks">'+data[area].tasks.map(t=>taskRow(t,esc)).join('')+'</div><button type="button" class="text-button" data-add-task="'+i+'">+ Add task</button></section>').join('')+'</div></details></section>';
}

export function taskRow(task,esc){return '<div class="readiness-task"><input type="checkbox" aria-label="Task completed" '+(task.done?'checked':'')+'><input type="text" aria-label="Task description" maxlength="500" placeholder="What remains to be done?" value="'+esc(task.text)+'"><button type="button" class="icon" data-remove-task aria-label="Remove task">×</button></div>';}
export function readReadiness(root){return normalizeReadiness(Object.fromEntries([...root.querySelectorAll('[data-area]')].map(el=>[el.dataset.area,{status:root.querySelector('[data-status-area="'+el.dataset.area+'"]:checked')?.value||'Not started',tasks:[...el.querySelectorAll('.readiness-task')].map(row=>({text:row.querySelector('input[type=text]').value,done:row.querySelector('input[type=checkbox]').checked}))}])));}
