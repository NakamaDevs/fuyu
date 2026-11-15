import test from 'node:test';
import assert from 'node:assert/strict';
import {bindFullscreen} from '../src/application/fullscreen.js';
function fixture(){
 const listeners=new Map(),classes=new Set();
 const doc={body:{classList:{toggle:(k,on)=>on?classes.add(k):classes.delete(k)}},addEventListener:(key,fn)=>listeners.set(key,fn)};
 const shell={ownerDocument:doc,classList:{toggle:()=>{}}};
 let click;const button={addEventListener:(key,fn)=>{click=fn;},setAttribute:()=>{}};
 bindFullscreen(shell,button,x=>x,()=>{});
 return {doc,shell,button,listeners,classes,click:()=>click()};
}
test('unsupported fullscreen expands the viewport and always allows exit',async()=>{
 const f=fixture();await f.click();assert.equal(f.button.textContent,'exitFullscreen');assert.ok(f.classes.has('game-expanded'));await f.click();assert.equal(f.button.textContent,'fullscreen');assert.ok(!f.classes.size);
});
test('rejected native fullscreen falls back and Escape exits',async()=>{
 const f=fixture();f.shell.requestFullscreen=async()=>{throw Error('unsupported');};await f.click();assert.ok(f.classes.size);f.listeners.get('keydown')({code:'Escape'});assert.ok(!f.classes.size);
});
test('native fullscreen exit and external exit synchronize the button',async()=>{
 const f=fixture();f.shell.requestFullscreen=async()=>{f.doc.fullscreenElement=f.shell;f.listeners.get('fullscreenchange')();};f.doc.exitFullscreen=async()=>{f.doc.fullscreenElement=null;f.listeners.get('fullscreenchange')();};await f.click();assert.equal(f.button.textContent,'exitFullscreen');await f.click();assert.equal(f.button.textContent,'fullscreen');await f.click();await f.doc.exitFullscreen();assert.equal(f.button.textContent,'fullscreen');
});
