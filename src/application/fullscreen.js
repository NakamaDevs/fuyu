// Native fullscreen where available; viewport-filling fallback for unsupported browsers.
export function bindFullscreen(shell,button,tr,clearInput){
 const doc=shell.ownerDocument;let expanded=false,busy=false;
 const active=()=>doc.fullscreenElement===shell||doc.webkitFullscreenElement===shell;
 function update(){const on=active()||expanded;button.textContent=tr(on?'exitFullscreen':'fullscreen');button.setAttribute('aria-pressed',String(on));shell.classList.toggle('expanded',on);doc.body.classList.toggle('game-expanded',on);}
 function changed(){expanded=false;clearInput();update();}
 async function toggle(){if(busy)return;busy=true;clearInput();try{if(active()){const exit=doc.exitFullscreen||doc.webkitExitFullscreen;await exit.call(doc);}else if(expanded){expanded=false;}else{const request=shell.requestFullscreen||shell.webkitRequestFullscreen;if(request){try{await request.call(shell);}catch{expanded=true;}}else expanded=true;}}finally{busy=false;update();}}
 button.addEventListener('click',toggle);doc.addEventListener('fullscreenchange',changed);doc.addEventListener('webkitfullscreenchange',changed);doc.addEventListener('keydown',e=>{if(e.code==='Escape'&&expanded){expanded=false;update();}});update();return {update};
}
