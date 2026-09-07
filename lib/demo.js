import {analyze} from './analysis.js';
export function demo() {
 const entries=[
 ['SDLGameEngine2026','A lightweight C++ game engine for teaching rendering, physics, and audio. The latest iteration of the classroom engine.','C++',8,['CMakeLists.txt','README.md','src/engine.cpp','tests/physics.cpp'],'SDL,Box2D,FMOD',false],
 ['github-dashboard','A home for your GitHub projects. Discover forgotten ideas, understand your work, and decide what comes next.','TypeScript',1,['package.json','README.md','src/App.tsx'],'React,Node.js',true],
 ['neural-playground','Interactive experiments exploring neural networks and small language models with visual explanations.','Python',19,['pyproject.toml','README.md','notebooks/train.ipynb'],'PyTorch',false],
 ['GAT360-Summer-2025','Unreal Engine classroom demonstrations covering projectile weapons, enemy AI, and a basic score system.','C++',410,['game.uproject','README.md'],'Unreal Engine',true],
 ['portfolio-studio','A personal portfolio featuring selected projects, case studies, and creative coding experiments.','TypeScript',38,['package.json','README.md'],'React,Next.js',false],
 ['SDLGameEngine2024','A lightweight C++ game engine for teaching rendering, physics, and audio. Original classroom engine.','C++',880,['CMakeLists.txt','README.md','src/engine.cpp'],'SDL,Box2D,FMOD',true],
 ['pi-weather-station','Raspberry Pi sensor collection with a small dashboard for temperature, humidity, and air quality.','Python',120,['requirements.txt','README.md','Dockerfile'],'Raspberry Pi',false],
 ['unity-platformer','An experimental 2D platformer exploring movement, procedural levels, and game feel.','C#',290,['ProjectSettings/ProjectVersion.txt','README.md'],'Unity',true],
 ['SDLGameEngine2025','A lightweight C++ game engine for teaching rendering, physics, and audio. Updated classroom engine.','C++',480,['CMakeLists.txt','README.md','src/engine.cpp'],'SDL,Box2D,FMOD',true],
 ['prompt-lab','A collection of prompt experiments and evaluation scripts for AI-assisted development.','Python',12,['pyproject.toml','README.md','tests/eval.py'],'AI',true],
 ['weekend-task-app','An early task management prototype with a local database and simple keyboard shortcuts.','JavaScript',1120,['package.json'],'React',true],
 ['arduino-led-wall','A programmable LED wall with animation patterns and audio-reactive effects.','C++',960,['wall.ino','README.md'],'Arduino',false]
 ];
 return entries.map(([name,description,language,days,files,tech,priv],i)=>{const r={id:i+1,name,full_name:`demo/${name}`,owner:{login:'demo'},description,language,private:priv,archived:false,fork:false,created_at:new Date(Date.now()-(days+250)*86400000).toISOString(),updated_at:new Date(Date.now()-days*86400000).toISOString(),pushed_at:new Date(Date.now()-days*86400000).toISOString(),size:(i+1)*1420,stargazers_count:[24,8,16,2,12,9,7,3,14,5,0,4][i],forks_count:i%4,open_issues_count:i%5,default_branch:'main',license:i%4?{spdx_id:'MIT'}:null,has_pages:i===4,topics:[],html_url:null,local:{tags:i%3===0?['Teaching']:i%3===1?['Personal']:['Experiment'],review:'Unreviewed',favorite:i===0||i===2,notes:''}};r.analysis=analyze(r,files,tech);r.analysis.technologies=[...new Set([language,...tech.split(',')])];return r;});
}
