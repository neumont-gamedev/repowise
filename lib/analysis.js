export function analyze(repo, files = [], contents = '') {
  const paths = files.join(' ').toLowerCase();
  const signals = `${paths} ${contents}`.toLowerCase();
  const technologies = new Set([repo.language, ...(repo.topics || [])].filter(Boolean));
  for (const [pattern, name] of [[/package.json/,'Node.js'],[/["']react["']/,'React'],[/["']next["']/,'Next.js'],[/requirements.txt|pyproject.toml/,'Python'],[/cmakelists.txt/,'C++'],[/\.csproj/,'C#'],[/\.uproject/,'Unreal Engine'],[/projectsettings\/|unity/,'Unity'],[/dockerfile/,'Docker'],[/cargo.toml/,'Rust'],[/pom.xml|build.gradle/,'Java'],[/sdl/,'SDL'],[/box2d/,'Box2D'],[/fmod/,'FMOD'],[/arduino|\.ino\b/,'Arduino'],[/raspberry/,'Raspberry Pi']]) if(pattern.test(signals)) technologies.add(name);
  const days = Math.max(0, Math.floor((Date.now()-Date.parse(repo.pushed_at || repo.created_at))/86400000));
  const readme = files.some(p=> /(^|\/)readme(\.|$)/i.test(p));
  const status = repo.archived ? 'Archived' : days < 30 ? 'Active' : days < 90 ? 'Recently Active' : days > 730 ? 'Archive Candidate' : 'Paused';
  const type = /engine/i.test(repo.name) ? 'Game Engine' : technologies.has('Unreal Engine') || technologies.has('Unity') ? 'Game Prototype' : technologies.has('React') || technologies.has('Next.js') ? 'Web Application' : /class|gat\d|teaching/i.test(repo.name) ? 'Teaching Material' : /experiment|prototype/i.test(repo.name) ? 'Experiment' : 'Application';
  const recommendation = repo.archived ? 'Keep' : days > 730 ? 'Archive' : files.length && !readme ? 'Add README' : !repo.description ? 'Add Description' : !repo.license ? 'Add License' : 'Keep Active';
  const reason = recommendation === 'Archive' ? `No push in ${Math.floor(days/365)} years. Review its ongoing value before archiving.` : recommendation === 'Add README' ? 'No README was found in the inspected file tree.' : recommendation === 'Add Description' ? 'A short description will make this project easier to rediscover.' : recommendation === 'Add License' ? 'No license is reported by GitHub. Review licensing before sharing.' : repo.archived ? 'Already archived; retain it as a reference.' : 'Recent activity or useful documentation suggests keeping this project available.';
  return {summary: repo.description || `${repo.language || 'Software'} project. Inspect its files to establish its purpose.`, technologies:[...technologies].slice(0,12), status, projectType:type, recommendation, recommendationReason:reason, days, readme:files.length ? readme : null, health:Math.min(100,(repo.description?25:0)+(repo.license?20:0)+(readme?30:0)+(files.some(p=>/test/i.test(p))?15:0)+(files.some(p=>/package.json|cmakelists|pyproject/i.test(p))?10:0)), completion:null, confidence:files.length ? 0.65 : 0.35, source:'Evidence-based estimate', files, analyzedAt:new Date().toISOString()};
}
export function similarity(a,b) {
  const tokens = r=>new Set(`${r.name.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/\d+/g,'')} ${r.description || ''}`.toLowerCase().split(/[^a-z]+/).filter(t=>t.length>2));
  const x=tokens(a),y=tokens(b),shared=[...x].filter(t=>y.has(t)).length;
  const names=shared/(new Set([...x,...y]).size||1);
  const ta=new Set(a.analysis.technologies),tb=new Set(b.analysis.technologies);
  const tech=[...ta].filter(t=>tb.has(t)).length/(new Set([...ta,...tb]).size||1);
  return Math.round(100*(names*.75+tech*.25));
}
export function matches(r, query) {
  let q=query.toLowerCase().trim();
  if(!q) return true;
  if(/private/.test(q) && !r.private || /public/.test(q) && r.private) return false;
  if(/archiv/.test(q) && !r.archived && r.analysis.recommendation!=='Archive') return false;
  const years=q.match(/(?:in|for|touched in) (\d+|two|three|one) years?/);
  if(years && r.analysis.days < (Number(years[1])||({one:1,two:2,three:3}[years[1]]))*365) return false;
  const year=q.match(/created in (20\d{2})/); if(year && !r.created_at.startsWith(year[1])) return false;
  if(/finished|complete/.test(q) && !/complete/i.test(r.local?.status||r.analysis.status)) return false;
  q=q.replace(/created in 20\d{2}/g,'').replace(/(?:in|for|touched in) (\d+|two|three|one) years?/g,'').replace(/\b(show|me|find|all|projects?|repositories|that|look|haven't|have|not|been|private|public|finished|complete|probably|need|to|be|archived|archive|i|the)\b/g,'').replace(/[^a-z0-9+#]+/g,' ').trim();
  const hay=`${r.name} ${r.description} ${r.analysis.summary} ${r.analysis.technologies.join(' ')} ${(r.local?.tags||[]).join(' ')} ${r.local?.projectType||r.analysis.projectType}`.toLowerCase();
  return q.split(/\s+/).every(t=>hay.includes(t));
}
