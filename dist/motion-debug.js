import * as THREE from './assets/three.module.js';
import {sampleOscillation} from './particle-motion.js';
export function createMotionDebug(scene,data){
  const categories=[['Grass',i=>data.mobility[i]===0&&Math.abs(data.positions[i*3])<4&&data.positions[i*3+2]>-12&&data.positions[i*3+2]<-2],['Crown',i=>data.weights[i]===.9&&data.positions[i*3+1]<9&&Math.abs(data.positions[i*3])<8],['Branch',i=>data.weights[i]>.001&&data.weights[i]<.05&&data.positions[i*3+1]>4.5],['Trunk',i=>data.weights[i]>.001&&data.weights[i]<.05&&data.positions[i*3+1]<3.2],['Background',i=>data.mobility[i]===1&&data.positions[i*3+2]< -40]];
  const indices=[],labels=[];for(const [name,predicate]of categories){const found=[];for(let i=0;i<data.weights.length;i++)if(predicate(i))found.push(i);for(let j=0;j<4;j++){indices.push(found[Math.floor((j+.4)/4*found.length)]);labels.push(name+' '+(j+1));}}
  const group=new THREE.Group();scene.add(group);let enabled=new URLSearchParams(location.search).get('motionDebug')==='1',selected=0,lastSample=-1,samples=0,cursor=0;
  const origin=new Float32Array(60),current=new Float32Array(60),axis=new Float32Array(120),history=new Float32Array(20*120*3),trail=new Float32Array(120*3),results=new Float64Array(80);
  const state={clock:0,motion:0,daylight:1,flowFast:0,flowSlow:0,burstFast:0,burstSlow:0},out=new Float64Array(4);
  const geom=array=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(array,3).setUsage(THREE.DynamicDrawUsage));return g;};
  const og=geom(origin),cg=geom(current),ag=geom(axis),tg=geom(trail);
  const om=new THREE.PointsMaterial({size:.1,color:'#ffffff',depthTest:false}),cm=new THREE.PointsMaterial({size:.14,color:'#ffb25d',depthTest:false}),am=new THREE.LineBasicMaterial({color:'#83cee4',transparent:true,opacity:.65,depthTest:false}),tm=new THREE.LineBasicMaterial({color:'#efcf71',depthTest:false});
  for(const obj of [new THREE.Points(og,om),new THREE.Points(cg,cm),new THREE.LineSegments(ag,am),new THREE.Line(tg,tm)]){obj.frustumCulled=false;obj.renderOrder=100;group.add(obj);}
  const panel=document.createElement('aside');panel.id='particleMotionDebug';Object.assign(panel.style,{position:'fixed',right:'14px',top:'100px',width:'310px',padding:'14px',background:'#101b24ef',border:'1px solid #9cc0cc88',color:'#e8f3ee',font:'11px/1.6 monospace',zIndex:1000,boxSizing:'border-box'});
  panel.innerHTML='<b>Particle trajectory debug · Shift+D</b><br><label>Sample <select id="debugParticle"></select></label><pre id="debugValues" style="white-space:pre-wrap;margin:8px 0"></pre><canvas id="debugTrail" width="280" height="100" style="width:100%;background:#0a1219"></canvas><small>White: original · Orange: current<br>Blue: fixed axis · Yellow: recent path</small>';
  const select=panel.querySelector('select');labels.forEach((label,i)=>{const option=document.createElement('option');option.value=i;option.textContent=label+' · #'+indices[i];select.appendChild(option);});select.onchange=()=>selected=Number(select.value);
  const text=panel.querySelector('pre'),plot=panel.querySelector('canvas'),ctx=plot.getContext('2d');document.body.appendChild(panel);
  const show=()=>{group.visible=enabled;panel.hidden=!enabled;};show();
  const key=e=>{if(e.shiftKey&&e.code==='KeyD'){e.preventDefault();enabled=!enabled;show();}};document.addEventListener('keydown',key);
  function update(clock,features,u){
    if(!enabled)return;state.clock=clock;state.motion=u.uMotion.value;state.daylight=u.uDaylight.value;state.flowFast=u.uFlowFast.value;state.flowSlow=u.uFlowSlow.value;state.burstFast=u.uBurstFast.value;state.burstSlow=u.uBurstSlow.value;
    for(let j=0;j<20;j++){const i=indices[j],k=i*3;sampleOscillation(i,data,state,out);for(let c=0;c<3;c++){origin[j*3+c]=data.positions[k+c]+data.dusk[k+c]*state.daylight;current[j*3+c]=out[c];axis[j*6+c]=origin[j*3+c]-data.axes[k+c]*Math.max(.35,out[3]);axis[j*6+3+c]=origin[j*3+c]+data.axes[k+c]*Math.max(.35,out[3]);results[j*4+c]=out[c];}results[j*4+3]=out[3];}
    for(const g of [og,cg,ag])g.attributes.position.needsUpdate=true;
    if(clock-lastSample<.08)return;lastSample=clock;for(let j=0;j<20;j++)for(let c=0;c<3;c++)history[(j*120+cursor)*3+c]=current[j*3+c];cursor=(cursor+1)%120;samples=Math.min(120,samples+1);
    for(let t=0;t<samples;t++){const h=(cursor-samples+t+120)%120;for(let c=0;c<3;c++)trail[t*3+c]=history[(selected*120+h)*3+c];}tg.attributes.position.needsUpdate=true;tg.setDrawRange(0,samples);
    const i=indices[selected],k=i*3,o=Array.from(origin.slice(selected*3,selected*3+3)),p=Array.from(current.slice(selected*3,selected*3+3)),d=Array.from(data.axes.slice(k,k+3)),format=v=>v.map(x=>x.toFixed(3)).join(', ');
    text.textContent='Audio RMS: '+(features.rms||0).toFixed(5)+'\nSmoothed Energy: '+(features.smoothedEnergy||0).toFixed(3)+'\nMotion Amplitude: '+(features.motionAmplitude||0).toFixed(3)+'\nStructural Release: '+(features.structuralRelease||0).toFixed(3)+'\nP0: '+format(o)+'\nP : '+format(p)+'\nAxis: '+format(d)+'\nCurrent range: ±'+results[selected*4+3].toFixed(3)+'\n20 fixed samples · no position accumulation';
    ctx.clearRect(0,0,280,100);ctx.strokeStyle='#82c5df';ctx.beginPath();ctx.moveTo(140-d[0]*120,50+d[1]*42);ctx.lineTo(140+d[0]*120,50-d[1]*42);ctx.stroke();const range=Math.max(.2,results[selected*4+3]*1.1);ctx.strokeStyle='#f0cf70';ctx.beginPath();for(let t=0;t<samples;t++){const x=140+(trail[t*3]-o[0])/range*115,y=50-(trail[t*3+1]-o[1])/range*42;t?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
  }
  return {update,info:()=>({enabled,indices,labels,selected,original:Array.from(origin),current:Array.from(current),axes:indices.map(i=>Array.from(data.axes.slice(i*3,i*3+3)))}),dispose(){document.removeEventListener('keydown',key);panel.remove();scene.remove(group);for(const g of [og,cg,ag,tg])g.dispose();for(const m of [om,cm,am,tm])m.dispose();}};
}
