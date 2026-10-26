import * as THREE from './assets/three.module.js';

// The scene is generated in three dimensions, without photographs or scanned assets.
export function createGarden(canvas) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias:false, alpha:false, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.4));
  renderer.setClearColor('#19271e');
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(53,1,.08,110);
  const positions=[],colors=[],sizes=[],mobility=[],seeds=[];
  let seed=91026;
  const random=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  const palette={wood:new THREE.Color('#bdc8a0'),woodDark:new THREE.Color('#6d8160'),leaf:new THREE.Color('#7a9b59'),lightLeaf:new THREE.Color('#b3c585'),deep:new THREE.Color('#354d35'),floor:new THREE.Color('#788266'),bark:new THREE.Color('#586346'),earth:new THREE.Color('#48503d'),pot:new THREE.Color('#7e7252')};
  const temp=new THREE.Color();
  const density=innerWidth<650?.42:.62;
  function add(x,y,z,color,base=.018,move=.1,shade=1){
    if(random()>density)return;
    const dapple=Math.sin(x*4.6+z*2.3+Math.sin(z*1.8))*Math.sin(z*3.2-y*3.8+Math.cos(x*2.5));
    const sun=dapple>.44 ? 1.35 : dapple>-.15 ? .92 : .61;
    const brightness=(.72+random()*.48)*shade*sun;
    temp.copy(color).multiplyScalar(brightness);
    positions.push(x,y,z);colors.push(temp.r,temp.g,temp.b);sizes.push(base*1.12*(.65+random()*.65));mobility.push(move);seeds.push(random()*100);
  }
  function box(cx,cy,cz,w,h,d,color,n=1000){
    const areas=[w*h,w*d,h*d],sum=areas.reduce((a,b)=>a+b,0);
    for(let i=0;i<n;i++){
      let x=(random()-.5)*w,y=(random()-.5)*h,z=(random()-.5)*d;
      const face=random()*sum,sgn=random()<.5?-1:1;
      if(face<areas[0])z=sgn*d/2;else if(face<areas[0]+areas[1])y=sgn*h/2;else x=sgn*w/2;
      const grain=.85+.15*Math.sin(y*14+Math.sin(z*19+x*5));
      add(cx+x,cy+y,cz+z,color,.019,.035,grain);
    }
  }
  function branch(points,radius,color,n=500){
    for(let i=0;i<n;i++){
      const t=random()*(points.length-1),j=Math.min(Math.floor(t),points.length-2),f=t-j;
      const a=points[j],b=points[j+1],angle=random()*Math.PI*2,r=radius*(1-.65*t/(points.length-1));
      add(a[0]+(b[0]-a[0])*f+Math.cos(angle)*r,a[1]+(b[1]-a[1])*f+Math.sin(angle)*r,a[2]+(b[2]-a[2])*f+(random()-.5)*r,color,.018,.35);
    }
  }
  function leaf(cx,cy,cz,r=.11){
    const angle=random()*Math.PI*2,tilt=(random()-.5)*1.4;
    const color=random()>.76?palette.lightLeaf:random()>.25?palette.leaf:palette.deep;
    for(let j=0;j<12;j++){
      const a=random()*Math.PI*2,rr=Math.sqrt(random()),u=Math.cos(a)*rr*r,v=Math.sin(a)*rr*r*.52;
      add(cx+u*Math.cos(angle)-v*Math.sin(angle),cy+v*tilt,cz+u*Math.sin(angle)+v*Math.cos(angle),color,.024,1,.9+random()*.35);
    }
  }

  // A continuous floor, flanked by raised planting beds and evenly spaced posts.
  for(let i=0;i<39000;i++){
    const x=(random()-.5)*5.7,z=5.8-random()*33;
    const seam=Math.abs(((z+32)%1.05)-.04)<.025;
    add(x,-.035+random()*.025,z,seam?palette.earth:palette.floor,.023,.025,seam?.55:.9);
  }
  for(let side of [-1,1]){
    box(side*2.67,.1,-10.2,.3,.23,32,palette.woodDark,3600);
    for(let k=0;k<12;k++){
      const z=5-k*2.65;
      box(side*2.72,2.05,z,.19,4.1,.22,palette.wood,1800);
      box(side*2.72,1.34,z-1.18,.17,.15,2.55,palette.wood,650);
      box(side*2.72,3.95,z-1.18,.19,.22,2.85,palette.woodDark,650);
      box(side*2.66,.55,z-1.15,.16,.12,2.5,palette.woodDark,400);
      if(k%2===0){
        box(side*2.38,1.29,z-.6,.65,.09,.48,palette.wood,500);
        box(side*2.62,1.08,z-.6,.13,.45,.13,palette.wood,160);
        const cx=side*2.4,cz=z-.6;
        for(let j=0;j<410;j++){const a=random()*6.283,y=1.37+random()*.38,r=.14+(y-1.37)*.19;add(cx+Math.cos(a)*r,y,cz+Math.sin(a)*r,palette.pot,.018,.05);}
        for(let j=0;j<32;j++)leaf(cx+(random()-.5)*.6,1.76+random()*.38,cz+(random()-.5)*.5,.12);
      }
    }
  }
  for(let k=0;k<15;k++){
    const z=5-k*2.13;
    box(0,4.04,z,5.7,.17,.19,palette.wood,2100);
    if(k%2===0)for(let x of [-1.65,-.55,.55,1.65])box(x,4.11,z-1.05,.07,.08,2.3,palette.woodDark,200);
  }
  // Climbing woody stems and a loose canopy. Gaps let the distant gate show through.
  for(let side of [-1,1])for(let k=0;k<9;k++){
    const z=3.6-k*3.15;
    const stem=[];
    for(let j=0;j<16;j++){const t=j/15;stem.push([side*(2.64-.8*t*t)+Math.sin(t*11+k)*.16,t*4.22,z+Math.sin(t*9+k)*.2]);}
    branch(stem,.065,palette.bark,1100);
    for(let arm=0;arm<3;arm++){
      const z0=z+(arm-1)*.45,pts=[];
      for(let j=0;j<18;j++){const t=j/17;pts.push([side*(2.2-t*3.2),4.14+Math.sin(t*4+arm)*.18,z0+Math.sin(t*7+arm)*.4]);}
      branch(pts,.04,palette.bark,500);
      for(let j=0;j<56;j++){const t=random(),ix=Math.min(16,Math.floor(t*17)),p=pts[ix];leaf(p[0]+(random()-.5)*.6,p[1]+(random()-.5)*.4,p[2]+(random()-.5)*.8,.1+random()*.06);}
    }
    for(let j=0;j<55;j++)leaf(side*(2.65+random()*.8),random()*4.2,z+(random()-.5)*3,.13);
    // Thin hanging tendrils, not a wall of uniformly scattered particles.
    if(k%2===0){const pts=[];for(let j=0;j<15;j++){const t=j/14;pts.push([side*(1.9+Math.sin(t*3+k)*.18),4.1-t*(.6+random()*.05),z+Math.sin(t*5)*.16]);}branch(pts,.018,palette.bark,270);}
  }
  // Background planting beyond the railings.
  for(let i=0;i<2100;i++){
    const s=random()<.5?-1:1;
    leaf(s*(3.1+random()*3.5),random()*5.8,5-random()*36,.09+random()*.1);
  }
  // End gate and two shallow steps establish the vanishing point.
  const end=-24.35;
  box(0,.15,end+1.35,5.2,.3,.6,palette.woodDark,2200);
  box(0,.37,end+.7,5.2,.22,.6,palette.floor,1800);
  box(0,2.05,end,4.5,.14,.16,palette.wood,1100);
  box(0,3.7,end,4.5,.14,.16,palette.wood,1100);
  box(0,.65,end,4.5,.16,.18,palette.wood,1100);
  for(let x=-2.15;x<2.3;x+=.47)box(x,2.2,end,.07,3.12,.1,palette.wood,730);
  for(let i=0;i<8500;i++){
    const x=(random()-.5)*6,y=random()*5,z=end-1-random()*5;
    add(x,y,z,random()<.5?palette.deep:palette.leaf,.023,.6,.8);
  }
  // Fallen leaves catch a little light on the path.
  for(let i=0;i<270;i++)leaf((random()-.5)*5.1,.015,5-random()*30,.035+random()*.045);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setAttribute('aSize',new THREE.Float32BufferAttribute(sizes,1));
  geometry.setAttribute('aMobility',new THREE.Float32BufferAttribute(mobility,1));
  geometry.setAttribute('aSeed',new THREE.Float32BufferAttribute(seeds,1));
  const uniforms={uPhase:{value:0},uEnergy:{value:0},uScale:{value:800},uMotion:{value:.8},uPulse:{value:0},uFog:{value:new THREE.Color('#19271e')}};
  const material=new THREE.ShaderMaterial({
    uniforms,vertexColors:true,transparent:true,depthWrite:true,depthTest:true,
    vertexShader:`attribute float aSize;attribute float aMobility;attribute float aSeed;
      uniform float uPhase,uEnergy,uScale,uMotion,uPulse;varying vec3 vColor;varying float vDistance;
      void main(){vec3 p=position;float wave=uPhase+aSeed;
        float amp=(0.012+uEnergy*0.085+uPulse*0.015)*uMotion*aMobility;
        p.x+=sin(wave+p.z*0.6)*amp;p.y+=cos(wave*0.83+p.x*0.8)*amp*0.7;p.z+=sin(wave*0.63+p.y)*amp*0.65;
        vec4 mv=modelViewMatrix*vec4(p,1.0);vDistance=-mv.z;
        gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(aSize*uScale*(0.76+uEnergy*1.3)/max(0.1,-mv.z),0.65,14.0);
        vColor=color*(1.0+uEnergy*0.08);
      }`,
    fragmentShader:`uniform vec3 uFog;varying vec3 vColor;varying float vDistance;
      void main(){vec2 uv=gl_PointCoord*2.0-1.0;float r=dot(uv,uv);if(r>1.0)discard;
        float alpha=exp(-r*1.8)*0.94;float fog=1.0-exp(-vDistance*vDistance*0.0003);
        gl_FragColor=vec4(mix(vColor,uFog,fog),alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const cloud=new THREE.Points(geometry,material);cloud.frustumCulled=false;scene.add(cloud);
  // Airborne motes have their own scale, so the architectural cloud stays legible.
  const air=new THREE.BufferGeometry(),airPositions=[];
  for(let i=0;i<520;i++)airPositions.push((random()-.5)*5,random()*3.8,6-random()*32);
  air.setAttribute('position',new THREE.Float32BufferAttribute(airPositions,3));
  const airMaterial=new THREE.PointsMaterial({color:'#d8dfb2',size:.018,transparent:true,opacity:.4,depthWrite:false});
  const motes=new THREE.Points(air,airMaterial);scene.add(motes);
  let yaw=0,pitch=0,distance=16.3,hoverX=0,hoverY=0,drag=null,targetYaw=0,targetPitch=0,phase=0,disposed=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function reset(){targetYaw=0;targetPitch=0;distance=16.3;hoverX=hoverY=0;}
  canvas.addEventListener('pointerdown',e=>{canvas.focus({preventScroll:true});drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(drag){targetYaw=Math.max(-.35,Math.min(.35,targetYaw-(e.clientX-drag.x)*.002));targetPitch=Math.max(-.16,Math.min(.19,targetPitch+(e.clientY-drag.y)*.0015));drag={x:e.clientX,y:e.clientY};}else{hoverX=(e.clientX/innerWidth-.5)*.07;hoverY=(e.clientY/innerHeight-.5)*.035;}});
  const endDrag=()=>drag=null;canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);canvas.addEventListener('lostpointercapture',endDrag);canvas.addEventListener('pointerleave',()=>{hoverX=hoverY=0;});
  canvas.addEventListener('wheel',e=>{e.preventDefault();distance=Math.max(10.7,Math.min(19.5,distance+e.deltaY*.008));},{passive:false});
  canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')targetYaw+=.025;if(e.key==='ArrowRight')targetYaw-=.025;if(e.key==='ArrowUp')targetPitch-=.015;if(e.key==='ArrowDown')targetPitch+=.015;targetYaw=Math.max(-.35,Math.min(.35,targetYaw));targetPitch=Math.max(-.16,Math.min(.19,targetPitch));}});
  function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<650?64:53;camera.updateProjectionMatrix();uniforms.uScale.value=h*renderer.getPixelRatio()/(2*Math.tan(camera.fov*Math.PI/360));}
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  function render(dt,features,motion=.8){
    if(disposed)return;
    const smoothing=1-Math.exp(-dt*4);yaw+=((targetYaw+hoverX)-yaw)*smoothing;pitch+=((targetPitch+hoverY)-pitch)*smoothing;
    camera.position.set(Math.sin(yaw)*distance,1.72+Math.sin(pitch)*distance,-10+Math.cos(yaw)*distance);
    camera.lookAt(0,1.72,-10);
    phase+=dt*(.19+features.speed*2.1)*(reduced?.35:1);
    uniforms.uPhase.value=phase;uniforms.uEnergy.value=features.energy;uniforms.uPulse.value=features.pulse;uniforms.uMotion.value=motion*(reduced?.3:1);
    motes.position.y=Math.sin(phase*.07)*.07;airMaterial.opacity=.28+features.energy*.2;
    renderer.render(scene,camera);
  }
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();document.getElementById('renderError').hidden=false;});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{document.getElementById('renderError').hidden=true;resize();});
  return {render,reset,count:positions.length/3,getCamera:()=>camera.position.toArray(),dispose(){disposed=true;observer.disconnect();geometry.dispose();material.dispose();air.dispose();airMaterial.dispose();renderer.dispose();}};
}
