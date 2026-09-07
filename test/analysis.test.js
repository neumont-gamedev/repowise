import test from 'node:test';
import assert from 'node:assert/strict';
import {analyze,similarity,matches} from '../lib/analysis.js';
import {demo} from '../lib/demo.js';
test('analysis detects frameworks from manifests and does not invent completion',()=>{const r={name:'sample',description:'A project',language:'TypeScript',pushed_at:new Date().toISOString()};const a=analyze(r,['package.json','README.md'],'{"dependencies":{"react":"*"}}');assert.ok(a.technologies.includes('React'));assert.equal(a.status,'Active');assert.equal(a.completion,null);assert.equal(a.readme,true);});
test('metadata-only analysis does not claim README is missing',()=>{const a=analyze({name:'sample',description:'Hi',pushed_at:new Date().toISOString()});assert.equal(a.readme,null);assert.notEqual(a.recommendation,'Add README');});
test('inactive repositories receive a reasoned, non-destructive recommendation',()=>{const r=demo().find(r=>r.name==='SDLGameEngine2024');assert.equal(r.analysis.recommendation,'Archive');assert.match(r.analysis.recommendationReason,/Review/);assert.equal(r.archived,false);});
test('yearly project versions match more strongly than unrelated projects',()=>{const rs=demo();assert.ok(similarity(rs[0],rs[5])>65);assert.ok(similarity(rs[0],rs[5])>similarity(rs[0],rs[2]));});
test('natural language applies technologies, visibility, and inactivity together',()=>{const r=demo().find(r=>r.name==='SDLGameEngine2024');assert.equal(matches(r,'Show me private C++ projects I haven\'t touched in two years'),true);assert.equal(matches(r,'Show me public C++ projects'),false);assert.equal(matches(r,'Find all Raspberry Pi projects'),false);});
