import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesVisibility} from '../public/filters.js';
test('visibility combines access choices with archive and fork requirements',()=>{
 const repo={private:true,archived:true,fork:false};assert.equal(matchesVisibility(repo,[]),true);assert.equal(matchesVisibility(repo,['private','archived']),true);assert.equal(matchesVisibility({...repo,archived:false},['private','archived']),false);assert.equal(matchesVisibility({...repo,private:false},['private','archived']),false);assert.equal(matchesVisibility(repo,['public','private']),true);assert.equal(matchesVisibility({...repo,private:false},['public','private']),true);assert.equal(matchesVisibility(repo,['private','forks']),false);
});
