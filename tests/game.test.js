import test from 'node:test';
import assert from 'node:assert/strict';
import {RULES,createGame,scenario,tick,move,attack,hurt,drink,rest,enterRoom,exitRoom,advanceDialogue} from '../src/domain/game.js';
import {toInput,bindInput,GAME_KEYS} from '../src/application/input.js';
import {messages,stories,readLanguage,readBrowserLanguage,translator} from '../src/application/i18n.js';

const close=(actual,expected,epsilon=1e-8)=>assert.ok(Math.abs(actual-expected)<epsilon,`${actual} != ${expected}`);
const active=()=>{const s=createGame();s.started=true;return s;};

test('walking and running use distinct speeds and running drains energy',()=>{
 const walk=scenario('movement'),run=scenario('movement');
 move(walk,{right:true},.25);move(run,{right:true,run:true},.25);
 close(walk.player.x-110,RULES.walk*.25);close(run.player.x-110,RULES.run*.25);
 close(walk.energy,100);close(run.energy,100-17*.25);
});

test('WASD and arrows are equivalent; discrete keys use pressed state',()=>{
 for(const [letter,arrow,field] of [['KeyA','ArrowLeft','left'],['KeyD','ArrowRight','right'],['KeyW','ArrowUp','up'],['KeyS','ArrowDown','down']]){
  assert.deepEqual(toInput(new Set([letter]),new Set()),toInput(new Set([arrow]),new Set()));
  assert.equal(toInput(new Set([letter]),new Set())[field],true);
 }
 const result=toInput(new Set(['Space','KeyQ']),new Set(['KeyQ','KeyJ','KeyK','KeyE']));
 for(const key of ['run','jump','attack','dash','interact'])assert.equal(result[key],true);
 assert.equal(toInput(new Set(['KeyJ']),new Set()).attack,false);
 assert.ok(GAME_KEYS.has('Escape')&&GAME_KEYS.has('KeyM'));
 const target=new EventTarget(),held=new Set(),pressed=new Set();const unbind=bindInput(target,held,pressed);
 const event=new Event('keydown',{cancelable:true});Object.defineProperties(event,{code:{value:'KeyA'},repeat:{value:false},target:{value:{tagName:'DIV'}}});target.dispatchEvent(event);
 assert.equal(event.defaultPrevented,true);assert.ok(held.has('KeyA')&&pressed.has('KeyA'));unbind();
});

test('jump works in both views and final form jumps higher',()=>{
 for(const scene of ['wings','rehearsal']){
  const base=active(),advanced=active();advanced.stage=2;if(scene!=='wings'){enterRoom(base,scene);enterRoom(advanced,scene);}
  move(base,{jump:true},.1);move(advanced,{jump:true},.1);
  const height=s=>scene==='wings'?540-s.player.y:s.iso.z;
  assert.ok(height(base)>0);assert.ok(height(advanced)>height(base));
  assert.ok(base.events.some(e=>e.type==='jump'));
 }
});

test('isometric diagonal movement is normalized',()=>{
 const a=active(),b=active();enterRoom(a,'rehearsal');enterRoom(b,'rehearsal');
 move(a,{right:true},.25);move(b,{right:true,down:true},.25);
 close(Math.hypot(a.iso.x,a.iso.y-2.8),RULES.walk/90*.25);
 close(Math.hypot(a.iso.x,a.iso.y-2.8),Math.hypot(b.iso.x,b.iso.y-2.8));
});

test('all three forms share jump strength across both views',()=>{
 const dt=1/60;
 for(const [stage,strength] of [RULES.jump,RULES.hybridJump,RULES.lizardJump].entries()){
  const side=active(),iso=active();side.stage=iso.stage=stage;enterRoom(iso,'rehearsal');
  move(side,{jump:true},dt);move(iso,{jump:true},dt);
  close(540-side.player.y,strength*dt-RULES.gravity*dt*dt);
  close(iso.iso.z,540-side.player.y);
 }
});

test('side dash keeps full speed after leaving an isometric room',()=>{
 for(const input of [{left:true,down:true},{right:true,up:true},{left:true},{right:true}]){
  const s=active();s.stage=1;enterRoom(s,'rehearsal');move(s,input,1/60);exitRoom(s);
  const before=s.player.x,direction=s.player.dir;
  move(s,{dash:true},1/60);
  close(s.player.x-before,direction*RULES.dash/60);
  close(s.energy,82);
 }
});

test('attacks spend energy, respect cooldown, range and form damage',()=>{
 const s=active(),enemy=s.enemies[0];s.player.x=enemy.x-50;s.player.dir=1;
 assert.equal(attack(s),true);assert.equal(enemy.hp,1);assert.equal(s.energy,92);
 assert.equal(attack(s),false);assert.equal(enemy.hp,1);assert.equal(s.energy,92);
 s.player.attack=0;s.energy=7;assert.equal(attack(s),false);
 s.energy=100;s.stage=2;assert.equal(attack(s),true);assert.equal(enemy.hp,0);assert.equal(s.kills,1);
 const iso=active();enterRoom(iso,'rehearsal');iso.iso.x=1;iso.iso.y=1;iso.player.faceX=1;iso.player.faceY=0;
 assert.equal(attack(iso),true);assert.equal(iso.enemies.find(e=>e.id==='wisp1').hp,1);
});

test('damage grants invulnerability; dash also protects and death respawns',()=>{
 const s=active();assert.equal(hurt(s),true);assert.equal(s.health,4);assert.equal(hurt(s),false);assert.equal(s.health,4);
 s.player.inv=0;s.player.dash=.1;assert.equal(hurt(s),false);s.player.dash=0;s.checkpoint=1135;
 assert.equal(hurt(s,4),true);assert.equal(s.health,5);assert.equal(s.energy,100);assert.equal(s.player.x,1135);assert.ok(s.events.some(e=>e.type==='respawn'));
});

test('dash requires upgrade, consumes energy and crosses ivy; works isometrically',()=>{
 const s=active();s.player.x=1230;move(s,{right:true,dash:true},.1);assert.equal(s.gate,false);assert.equal(s.player.x,1240);
 s.stage=1;s.energy=100;move(s,{right:true,dash:true},.1);assert.equal(s.gate,true);assert.equal(s.energy,82);assert.ok(s.player.x>1240);
 const i=active();i.stage=1;enterRoom(i,'rehearsal');const before=i.iso.x;move(i,{right:true,dash:true},.1);assert.ok(i.iso.x>before);assert.equal(i.energy,82);assert.ok(i.player.cool>0);
 i.player.dash=0;const energy=i.energy, dashEvents=i.events.filter(e=>e.type==='dash').length;move(i,{dash:true},.01);assert.equal(i.events.filter(e=>e.type==='dash').length,dashEvents);assert.ok(i.energy>=energy);
});

test('bottles are single-use and fountain restores regular enemies only',()=>{
 const s=active(),b=s.bottles[0];s.health=2;s.energy=20;assert.equal(drink(s,b),true);assert.equal(s.health,4);assert.equal(s.energy,65);assert.equal(drink(s,b),false);
 s.enemies[0].hp=0;s.bosses[0].hp=0;s.stage=1;enterRoom(s,'rehearsal');rest(s);
 assert.equal(s.health,5);assert.equal(s.energy,100);assert.equal(s.enemies[0].hp,2);assert.equal(s.bosses[0].hp,0);assert.equal(s.stage,1);assert.equal(b.used,true);assert.equal(drink(s,b),false);
});

test('localization has key parity and defaults safely to Spanish',()=>{
 assert.deepEqual(Object.keys(messages.es).sort(),Object.keys(messages.en).sort());assert.deepEqual(Object.keys(stories.es).sort(),Object.keys(stories.en).sort());
 assert.equal(readLanguage(), 'es');assert.equal(readLanguage({getItem:()=> 'en'}),'en');assert.equal(readLanguage({getItem:()=> 'invalid'}),'es');assert.equal(readLanguage({getItem(){throw Error('blocked');}}),'es');
 assert.equal(translator('en')('health'),messages.en.health);assert.equal(translator('invalid')('health'),messages.es.health);assert.equal(translator('en')('missing-key'),'missing-key');
});

test('blocked browser storage still permits Spanish startup',()=>{
 const blocked={get localStorage(){throw new DOMException('Storage denied','SecurityError');}};
 assert.equal(readBrowserLanguage(blocked),'es');
 assert.equal(readBrowserLanguage({localStorage:{getItem:()=> 'en'}}),'en');
});

function completeJourney(){
 const s=active();s.enemies.forEach(e=>e.hp=0);
 function doorway(x){s.player.x=x;s.player.y=540;s.player.ground=true;tick(s,{interact:true},.01);}
 function defeat(boss){s.player.x=boss.x-60;s.player.y=540;s.player.dir=1;while(boss.hp>0){s.player.attack=0;s.energy=100;assert.equal(attack(s),true);} }
 doorway(1110);assert.equal(s.scene,'wings');assert.equal(s.prompt,'sealed');
 defeat(s.bosses[0]);doorway(1110);assert.equal(s.scene,'rehearsal');
 s.iso.x=-1.8;s.iso.y=-1.5;tick(s,{interact:true},.01);assert.equal(s.stage,1);assert.equal(s.dialogue,'hybrid');advanceDialogue(s,2);advanceDialogue(s,2);exitRoom(s);
 s.player.x=1230;move(s,{right:true,dash:true},.1);assert.equal(s.gate,true);s.player.dash=0;
 doorway(1840);assert.equal(s.scene,'wings');assert.equal(s.prompt,'sealed');
 defeat(s.bosses[1]);doorway(1840);assert.equal(s.scene,'mirror');
 s.iso.x=2;s.iso.y=-3;tick(s,{interact:true},.01);assert.equal(s.stage,2);assert.equal(s.dialogue,'final');advanceDialogue(s,2);advanceDialogue(s,2);exitRoom(s);
 s.player.x=2100;s.player.y=300;s.player.vy=0;s.player.ground=false;tick(s,{interact:true},.01);assert.equal(s.dialogue,'crossing');advanceDialogue(s,1);
 assert.equal(s.ended,true);assert.equal(s.stage,0);assert.equal(s.scene,'theater');assert.equal(s.dialogue,'home');assert.ok(s.visited.includes('theater'));
 return s;
}
test('boss gates, both upgrades, and human ending form a reproducible complete progression',()=>{assert.deepEqual(completeJourney(),completeJourney());});

test('fixed-step player inputs defeat the first boss without resource resets',()=>{
 const s=scenario('boss');let jumps=0,attacks=0,backoffFrames=0;
 for(let frame=0;frame<60*20&&s.bosses[0].hp>0;frame++){
  const b=s.bosses[0],distance=b.x-s.player.x;
  const input={right:distance>95&&b.phase!=='windup',left:distance<65||(b.phase==='windup'&&distance<120),attack:Math.abs(distance)<130,jump:s.player.ground&&(b.phase==='windup'||b.phase==='charge')};
  if(input.left)backoffFrames++;
  tick(s,input,1/60);
  jumps+=s.events.filter(e=>e.type==='jump').length;attacks+=s.events.filter(e=>e.type==='attack').length;
 }
 assert.equal(s.bosses[0].hp,0);assert.ok(attacks>=8);assert.ok(jumps>0);assert.ok(backoffFrames>0);assert.ok(s.health>0);assert.ok(s.energy<100);
});

test('death from enemy contact respawns at the fountain checkpoint through ticks',()=>{
 const s=active();s.bosses.forEach(b=>b.hp=0);enterRoom(s,'rehearsal');s.iso.x=-2.8;s.iso.y=1;
 tick(s,{interact:true},1/60);assert.equal(s.checkpoint,1135);exitRoom(s);
 s.player.x=510;s.player.y=540;s.enemies[0].x=510;s.enemies[0].home=510;
 let respawned=false;for(let frame=0;frame<60*10&&!respawned;frame++){tick(s,{},1/60);respawned=s.events.some(e=>e.type==='respawn');}
 assert.equal(respawned,true);assert.equal(s.scene,'wings');assert.equal(s.player.x,1135);assert.equal(s.health,5);assert.equal(s.energy,100);assert.equal(s.damageTaken,5);
});

test('isometric run and dash follow normalized directions through tick inputs',()=>{
 function runInput(input){const s=active();s.stage=1;enterRoom(s,'rehearsal');s.enemies=[];tick(s,input,.1);return s;}
 const straight=runInput({right:true,run:true}),diagonal=runInput({right:true,down:true,run:true});
 const distance=s=>Math.hypot(s.iso.x,s.iso.y-2.8);
 close(distance(straight),RULES.run/90*.1);close(distance(diagonal),distance(straight));close(straight.energy,98.3);
 const dash=runInput({right:true,down:true,dash:true});close(distance(dash),RULES.dash/90*.1);close(dash.energy,82);close(dash.player.faceX,1);close(dash.player.faceY,0);
 assert.ok(dash.events.some(e=>e.type==='dash'));
});

test('jump, attack and dash inputs are active in both gameplay views',()=>{
 for(const scene of ['wings','rehearsal']){
  const s=active();s.stage=1;s.enemies=[];s.bosses.forEach(b=>b.hp=0);if(scene!=='wings')enterRoom(s,scene);
  tick(s,{jump:true,attack:true,dash:true,right:true},1/60);
  for(const action of ['jump','attack','dash'])assert.ok(s.events.some(e=>e.type===action),`${scene}: ${action}`);
  assert.ok(s.energy<100);
 }
});
