import {mkdir,cp,copyFile,writeFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true});
await copyFile('lib/analysis.js','dist/analysis.js');
await copyFile('lib/demo.js','dist/demo.js');
await writeFile('dist/runtime-config.js','export const HOSTED = true;\n');
console.log('Firebase Hosting build ready in dist/');

