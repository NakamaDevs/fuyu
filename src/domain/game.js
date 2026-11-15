// Pure simulation: no browser, rendering, storage or wall-clock dependencies.
export const RULES=Object.freeze({walk:240,run:390,dash:780,gravity:1550,jump:590,hybridJump:690,lizardJump:880,maxHealth:5,maxEnergy:100});
export const PLATFORMS=[{x:290,y:445,w:175},{x:600,y:365,w:160},{x:930,y:455,w:160},{x:1440,y:410,w:140},{x:1670,y:350,w:170},{x:1920,y:405,w:110},{x:2070,y:285,w:130}];
export const ROOMS=[
 {id:'wings',name:'wings',x:30,y:230,w:180,h:80,kind:'side'},
 {id:'threshold',name:'threshold',x:250,y:230,w:170,h:80,kind:'boss'},
 {id:'rehearsal',name:'rehearsal',x:265,y:65,w:160,h:95,kind:'iso'},
 {id:'grove',name:'grove',x:465,y:230,w:170,h:80,kind:'boss'},
 {id:'mirror',name:'mirror',x:480,y:65,w:160,h:95,kind:'iso'},
 {id:'tower',name:'tower',x:680,y:180,w:100,h:130,kind:'side'},
 {id:'theater',name:'theater',x:670,y:50,w:130,h:65,kind:'end'}
];
export const CONNECTIONS=[['wings','threshold'],['threshold','rehearsal'],['threshold','grove'],['grove','mirror'],['grove','tower'],['tower','theater']];
function regulars(){return [{id:'shadow1',x:510,y:540,home:510,hp:2,maxHp:2,scene:'wings',hit:0},{id:'shadow2',x:1410,y:540,home:1410,hp:3,maxHp:3,scene:'wings',hit:0},{id:'wisp1',x:2,y:1,home:2,hp:2,maxHp:2,scene:'rehearsal',hit:0},{id:'wisp2',x:-2,y:-.1,home:-2,hp:3,maxHp:3,scene:'mirror',hit:0}];}
export function createGame(){return {started:false,paused:false,time:0,stage:0,scene:'wings',health:5,energy:100,echoes:0,gate:false,ended:false,checkpoint:110,visited:['wings'],seenGates:[],events:[],prompt:'',promptSource:'',kills:0,hits:0,damageTaken:0,rests:0,iso:{x:0,y:2.8,z:0,vz:0},player:{x:110,y:540,vx:0,vy:0,dir:1,ground:true,attack:0,dash:0,cool:0,inv:0,faceX:1,faceY:0,speed:0},enemies:regulars(),bosses:[{id:'threshold',name:'boss1',x:875,y:540,home:875,hp:8,maxHp:8,scene:'wings',hit:0,phase:'idle',timer:1.5,dir:-1},{id:'grove',name:'boss2',x:1585,y:540,home:1585,hp:10,maxHp:10,scene:'wings',hit:0,phase:'idle',timer:1.7,dir:-1}],bottles:[{x:710,y:540,used:false},{x:1735,y:540,used:false}],echoItems:[{x:365,y:410,taken:false},{x:665,y:330,taken:false},{x:1000,y:420,taken:false}],dialogue:null,dialogueLine:0};}
export function currentRoom(s){if(s.scene!=='wings')return s.scene;return s.player.x<720?'wings':s.player.x<1270?'threshold':s.player.x<1900?'grove':'tower';}
function event(s,type,extra={}){s.events.push({type,...extra});}
function discover(s,id){if(!s.visited.includes(id)){s.visited.push(id);event(s,'discover',{room:id});}}
function seeGate(s,id){if(!s.seenGates.includes(id))s.seenGates.push(id);}
export function startDialogue(s,id){s.dialogue=id;s.dialogueLine=0;event(s,'dialogue',{id});}
export function advanceDialogue(s,length){if(++s.dialogueLine>=length){const id=s.dialogue;s.dialogue=null;s.dialogueLine=0;if(id==='crossing'){s.stage=0;s.scene='theater';s.ended=true;discover(s,'theater');startDialogue(s,'home');}}}
export function enterRoom(s,room){s.scene=room;s.iso={x:0,y:2.8,z:0,vz:0};s.player.attack=0;s.player.dash=0;discover(s,room);event(s,'room',{room});}
export function exitRoom(s){const from=s.scene;s.scene='wings';s.player.x=from==='mirror'?1855:1135;s.player.y=540;s.player.vy=0;s.player.ground=true;s.player.dash=0;event(s,'room',{room:'wings'});}
export function hurt(s,amount=1){if(s.player.inv>0||s.player.dash>0||s.ended)return false;s.health=Math.max(0,s.health-amount);s.damageTaken+=amount;s.player.inv=1.25;event(s,'damage',{amount});if(s.health<=0){s.health=5;s.energy=100;s.scene='wings';s.player.x=s.checkpoint;s.player.y=540;s.player.vy=0;s.player.ground=true;event(s,'respawn');}return true;}
export function rest(s){s.health=5;s.energy=100;s.rests++;s.enemies=regulars();s.checkpoint=s.scene==='mirror'?1855:1135;event(s,'rest');}
export function drink(s,bottle){if(bottle.used||(s.health===5&&s.energy===100))return false;bottle.used=true;s.health=Math.min(5,s.health+2);s.energy=Math.min(100,s.energy+45);event(s,'drink');return true;}
export function attack(s){const p=s.player;if(p.attack>0||s.energy<8||s.ended)return false;p.attack=.28;s.energy-=8;event(s,'attack');for(const e of [...s.enemies,...s.bosses]){if(e.hp<=0||e.scene!==s.scene)continue;let reachable=false;if(s.scene==='wings'){reachable=Math.abs(e.x-p.x)<(e.maxHp>=8?145:110)&&Math.abs(e.y-p.y)<105&&(e.x-p.x)*p.dir>-20;}else{const dx=e.x-s.iso.x,dy=e.y-s.iso.y;reachable=Math.hypot(dx,dy)<1.7&&s.iso.z<100&&(dx*p.faceX+dy*p.faceY)>-.25;}
 if(reachable){e.hp=Math.max(0,e.hp-(s.stage===2?2:1));e.hit=.25;s.hits++;event(s,'hit',{enemy:e.id,x:e.x,y:e.y});if(e.hp===0){s.kills++;event(s,'defeat',{enemy:e.id,boss:e.maxHp>=8});}}}return true;}
export function move(s,input,dt){const p=s.player,side=s.scene==='wings';let dx=(input.right?1:0)-(input.left?1:0),dy=side?0:(input.down?1:0)-(input.up?1:0);if(dx)p.dir=Math.sign(dx);let ix=side?dx:(dx+dy)*Math.SQRT1_2,iy=side?0:(dy-dx)*Math.SQRT1_2;const n=Math.hypot(ix,iy);if(n){ix/=n;iy/=n;p.faceX=ix;p.faceY=iy;}
 if(input.dash&&s.stage>0&&p.cool<=0&&s.energy>=18){p.dash=.22;p.cool=.85;s.energy-=18;event(s,'dash');}
 const running=input.run&&n>0&&s.energy>0&&p.dash<=0;const speed=p.dash>0?RULES.dash:running?RULES.run:RULES.walk;p.speed=n||p.dash>0?speed:0;
 if(running)s.energy=Math.max(0,s.energy-17*dt);else if(p.dash<=0&&p.attack<=0)s.energy=Math.min(100,s.energy+22*dt);
 const vx=p.dash>0?(side?p.dir:p.faceX)*speed:ix*speed,vy=p.dash>0?p.faceY*speed:iy*speed;
 if(side){const previousY=p.y;p.vx=vx;p.x+=vx*dt;if(input.jump&&p.ground){p.vy=-(s.stage===2?RULES.lizardJump:s.stage===1?RULES.hybridJump:RULES.jump);p.ground=false;event(s,'jump');}p.vy+=RULES.gravity*dt;p.y+=p.vy*dt;p.ground=false;if(p.y>=540){p.y=540;p.vy=0;p.ground=true;}for(const platform of PLATFORMS)if(p.x>platform.x-15&&p.x<platform.x+platform.w+15&&previousY<=platform.y+3&&p.y>=platform.y&&p.vy>=0){p.y=platform.y;p.vy=0;p.ground=true;}
 if(!s.gate&&p.x>1240){seeGate(s,'ivy');if(p.dash>0&&s.stage>0){s.gate=true;event(s,'gate');}else p.x=1240;}p.x=Math.max(45,Math.min(2160,p.x));
 }else{const i=s.iso;i.x=Math.max(-3.7,Math.min(3.7,i.x+vx/90*dt));i.y=Math.max(-3.7,Math.min(3.7,i.y+vy/90*dt));if(input.jump&&i.z===0){i.vz=s.stage===2?RULES.lizardJump:s.stage===1?RULES.hybridJump:RULES.jump;event(s,'jump');}i.vz-=RULES.gravity*dt;i.z=Math.max(0,i.z+i.vz*dt);if(i.z===0)i.vz=0;p.ground=i.z===0;}
}
function bossAI(s,b,dt){if(b.hp<=0)return;b.hit=Math.max(0,b.hit-dt);if(s.scene!=='wings'||Math.abs(s.player.x-b.home)>330)return;b.timer-=dt;if(b.phase==='idle'&&b.timer<=0){b.phase='windup';b.timer=.7;b.dir=s.player.x>b.x?1:-1;event(s,'bossWindup',{enemy:b.id});}else if(b.phase==='windup'&&b.timer<=0){b.phase='charge';b.timer=.48;}else if(b.phase==='charge'){b.x+=b.dir*300*dt;if(b.timer<=0){b.phase='idle';b.timer=1.35;}}b.x=Math.max(b.home-150,Math.min(b.home+150,b.x));if(Math.abs(b.x-s.player.x)<52&&Math.abs(s.player.y-540)<80)hurt(s);}
export function tick(s,input={},dt=1/60){if(!Number.isFinite(dt)||dt<=0)return;s.events=[];if(!s.started||s.paused||s.dialogue||s.ended)return;s.time+=dt;const p=s.player;for(const k of ['inv','attack','cool','dash'])p[k]=Math.max(0,p[k]-dt);move(s,input,dt);if(input.attack)attack(s);for(const b of s.bosses)bossAI(s,b,dt);for(const e of s.enemies){e.hit=Math.max(0,e.hit-dt);if(e.hp<=0||e.scene!==s.scene)continue;if(s.scene==='wings'){e.x+=Math.sin(s.time+e.home)*dt*24;if(Math.abs(e.x-p.x)<34&&Math.abs(e.y-p.y)<60)hurt(s);}else if(Math.hypot(e.x-s.iso.x,e.y-s.iso.y)<.55&&s.iso.z<65)hurt(s);}
 for(const e of s.echoItems)if(s.scene==='wings'&&!e.taken&&Math.hypot(p.x-e.x,p.y-45-e.y)<55){e.taken=true;s.echoes++;event(s,'echo',{x:e.x,y:e.y});}for(const b of s.bottles)if(s.scene==='wings'&&Math.hypot(p.x-b.x,p.y-b.y)<35)drink(s,b);
 discover(s,currentRoom(s));s.prompt='';s.promptSource='';if(s.scene==='wings'){
 if(Math.abs(p.x-1110)<75&&p.y>440){seeGate(s,'rehearsal');if(s.bosses[0].hp===0){s.prompt='enter';if(input.interact)enterRoom(s,'rehearsal');}else s.prompt='sealed';}
 if(Math.abs(p.x-1840)<70&&p.y>440){seeGate(s,'mirror');if(s.bosses[1].hp===0){s.prompt='enter';if(input.interact)enterRoom(s,'mirror');}else s.prompt='sealed';}
 if(p.x>2050){seeGate(s,'exit');if(s.stage===2&&p.y<=310){s.prompt='cross';if(input.interact)startDialogue(s,'crossing');}}
 }else{
 const i=s.iso;if(Math.hypot(i.x,i.y-3)<1.1&&i.z<15){s.prompt='leave';if(input.interact)exitRoom(s);}
 if(Math.hypot(i.x+2.8,i.y-1)<1.05&&i.z<15){s.prompt='rest';if(input.interact)rest(s);}
 if(s.scene==='rehearsal'&&Math.hypot(i.x+1.8,i.y+1.5)<1.3&&i.z<20){s.prompt='listen';if(input.interact){if(s.stage===0){s.stage=1;s.health=5;s.energy=100;startDialogue(s,'hybrid');event(s,'upgrade',{ability:'dash'});}else startDialogue(s,'remember');}}
 if(s.scene==='mirror'&&Math.hypot(i.x-2,i.y+3)<1.3&&i.z<20){s.prompt='reflect';if(input.interact){if(s.stage<2){s.stage=2;s.health=5;s.energy=100;startDialogue(s,'final');event(s,'upgrade',{ability:'leap'});}else startDialogue(s,'remember');}}
 }return s;}
// Accessible QA scenarios use the same simulation and controls as the game.
export function scenario(name){const s=createGame();s.started=true;if(name==='movement'){s.enemies=[];s.bosses.forEach(b=>b.hp=0);s.gate=true;}
 if(name==='combat'){s.player.x=400;s.enemies[0].x=465;s.enemies[0].home=465;}
 if(name==='damage'){s.player.x=510;}
 if(name==='dash'){s.stage=1;s.player.x=1150;s.player.faceX=1;s.bosses[0].hp=0;}
 if(name==='isometric'){s.stage=1;enterRoom(s,'rehearsal');s.iso.x=.5;s.iso.y=1;s.player.faceX=1;s.player.faceY=0;}
 if(name==='boss'){s.player.x=745;s.enemies=[];}
 if(name==='fountain'){s.stage=1;s.health=2;s.energy=20;s.enemies[0].hp=0;s.bosses[0].hp=0;enterRoom(s,'rehearsal');s.iso.x=-2.8;s.iso.y=1;}
 if(name==='final'){s.stage=2;s.gate=true;s.bosses.forEach(b=>b.hp=0);s.player.x=1930;s.enemies=[];s.visited=['wings','threshold','rehearsal','grove','mirror','tower'];}
 return s;}
