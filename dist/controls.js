export const visualControls={animationSpeed:1,distance:1,zoom:1,beatPulse:1,looseness:1,particleSize:1,rotation:0,color:1};
export function initVisualControls(media){
 const defaults={...visualControls};
 for(const key of Object.keys(defaults)){const slider=document.getElementById('vc-'+key),out=document.getElementById('vo-'+key);slider.addEventListener('input',()=>{visualControls[key]=Number(slider.value);out.textContent=visualControls[key].toFixed(1)+'×';});}
 document.getElementById('resetVisualControls').addEventListener('click',()=>{for(const [key,value]of Object.entries(defaults)){visualControls[key]=value;document.getElementById('vc-'+key).value=value;document.getElementById('vo-'+key).textContent=value.toFixed(1)+'×';}});
 const body=document.getElementById('visualControlsBody'),toggle=document.getElementById('toggleControls');
 toggle.setAttribute('aria-controls','visualControlsBody');
 function expand(open){document.getElementById('visualControls').classList.toggle('controls-collapsed',!open);body.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Collapse controls':'Expand controls');toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+(open?'M7 14l5-5 5 5':'M7 10l5 5 5-5')+'"/></svg>';toggle.title=open?'Collapse controls':'Expand controls';}
 expand(innerWidth>700);toggle.addEventListener('click',()=>expand(body.hidden));
 const panel=document.querySelector('.music-panel'),dock=document.createElement('div');dock.id='playerDock';dock.className='player-dock';panel.before(dock);dock.append(panel);
 const tab=document.createElement('button');tab.className='player-reveal';tab.textContent='Music player ↑';tab.setAttribute('aria-label','Expand music player');tab.setAttribute('aria-expanded','true');dock.append(tab);
 let timer,pointer=false,touchOpen=false;
 function reveal(open){dock.classList.toggle('player-collapsed',!open&&!media.paused&&!media.ended);tab.setAttribute('aria-expanded',String(!dock.classList.contains('player-collapsed')));}
 function schedule(){clearTimeout(timer);timer=setTimeout(()=>{if(!pointer&&!dock.contains(document.activeElement)&&!touchOpen)reveal(false);},1800);}
 dock.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch'){pointer=true;clearTimeout(timer);reveal(true);}});
 dock.addEventListener('pointerleave',()=>{pointer=false;touchOpen=false;schedule();});
 dock.addEventListener('focusin',()=>reveal(true));dock.addEventListener('focusout',schedule);
 tab.addEventListener('click',()=>{touchOpen=true;reveal(true);});
 media.addEventListener('play',()=>{if(dock.contains(document.activeElement))document.activeElement.blur();touchOpen=false;schedule();});
 for(const name of ['pause','ended','emptied'])media.addEventListener(name,()=>{clearTimeout(timer);reveal(true);});
 document.addEventListener('pointerdown',e=>{if(!dock.contains(e.target)){touchOpen=false;schedule();}});
 const observer=new ResizeObserver(()=>dock.style.height=panel.getBoundingClientRect().height+'px');observer.observe(panel);
 window.gardenVisualControls=()=>({...visualControls});
}

export function extremeControlMix(c){const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};return Math.min(smooth(((c.animationSpeed??1)-1.6)/1.4),smooth(((c.distance??1)-1.3)/.7),smooth(((c.looseness??1)-1.3)/.7));}
