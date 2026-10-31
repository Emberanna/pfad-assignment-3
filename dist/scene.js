import * as THREE from './assets/three.module.js';
import {buildMeadow} from './particle-meadow.js';

// The scene is generated in three dimensions, without photographs or scanned assets.
export async function createGarden(canvas) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias:false, alpha:false, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.4));
  renderer.setClearColor('#302732');
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();
  const bloomTarget=new THREE.WebGLRenderTarget(1,1,{depthBuffer:true});
  const bloomScene=new THREE.Scene(),bloomCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const bloomMaterial=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{image:{value:bloomTarget.texture},texel:{value:new THREE.Vector2(1,1)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',fragmentShader:`uniform sampler2D image;uniform vec2 texel;varying vec2 vUv;
    void main(){vec3 base=texture2D(image,vUv).rgb;vec3 halo=vec3(0.0);
      for(int x=-1;x<=1;x++){for(int y=-1;y<=1;y++){vec3 c=texture2D(image,vUv+vec2(float(x),float(y))*texel*3.0).rgb;halo+=max(c-vec3(0.48),vec3(0.0));}}
      gl_FragColor=vec4(base+halo*0.025,1.0);
      #include <colorspace_fragment>
    }`});
  const bloomQuad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),bloomMaterial);bloomScene.add(bloomQuad);
  const camera=new THREE.PerspectiveCamera(53,1,.08,320);
  const {positions,colors,sizes,mobility,seeds}=await buildMeadow(innerWidth<650);
  let moteSeed=913;const random=()=>{moteSeed=(Math.imul(moteSeed,1664525)+1013904223)|0;return(moteSeed>>>0)/4294967296;};
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setAttribute('aSize',new THREE.Float32BufferAttribute(sizes,1));
  geometry.setAttribute('aMobility',new THREE.Float32BufferAttribute(mobility,1));
  geometry.setAttribute('aSeed',new THREE.Float32BufferAttribute(seeds,1));
  const uniforms={uLow:{value:0},uMid:{value:0},uHigh:{value:0},uPhase:{value:0},uEnergy:{value:0},uScale:{value:800},uMotion:{value:.8},uPulse:{value:0},uFog:{value:new THREE.Color('#302732')}};
  const material=new THREE.ShaderMaterial({
    uniforms,vertexColors:true,transparent:true,depthWrite:true,depthTest:true,
    vertexShader:`attribute float aSize;attribute float aMobility;attribute float aSeed;
      uniform float uPhase,uEnergy,uScale,uMotion,uPulse,uLow,uMid,uHigh;varying vec3 vColor;varying float vDistance;
      void main(){vec3 p=position;float wave=uPhase+aSeed;
        float grass=1.0-step(0.5,aMobility);float haze=step(2.5,aMobility);float sparkle=step(1.5,aMobility)*(1.0-haze);float amp=(grass*(0.008+uLow*0.10)+(1.0-grass)*(0.018+uMid*0.14))*uMotion*(1.0-haze);
        p.x+=sin(wave+p.z*0.6)*amp;p.y+=cos(wave*0.83+p.x*0.8)*amp*0.7;p.z+=sin(wave*0.63+p.y)*amp*0.65;
        vec4 mv=modelViewMatrix*vec4(p,1.0);vDistance=-mv.z;
        gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(aSize*uScale*(1.05+uEnergy*0.65)/max(0.1,-mv.z),mix(1.1,0.65,haze),mix(mix(8.0,22.0,step(0.5,aMobility)),2.0,haze));
        vColor=color*(1.08+uEnergy*0.08+sparkle*uHigh*(0.4+0.4*sin(wave*3.0)));
      }`,
    fragmentShader:`uniform vec3 uFog;varying vec3 vColor;varying float vDistance;
      void main(){vec2 uv=gl_PointCoord*2.0-1.0;float r=dot(uv,uv);if(r>1.0)discard;
        float alpha=exp(-r*1.5)*0.95;float fog=1.0-exp(-vDistance*vDistance*0.000025);
        gl_FragColor=vec4(mix(vColor,uFog,fog),alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const cloud=new THREE.Points(geometry,material);cloud.frustumCulled=false;scene.add(cloud);
  const glowMaterial=material.clone();glowMaterial.uniforms=uniforms;glowMaterial.depthWrite=false;glowMaterial.blending=THREE.AdditiveBlending;
  glowMaterial.vertexShader=glowMaterial.vertexShader.replace('vColor=color*','gl_PointSize*=mix(1.35,1.9,step(0.5,aMobility));vColor=color*');
  glowMaterial.fragmentShader=glowMaterial.fragmentShader.replace('exp(-r*1.5)*0.95','exp(-r*3.8)*0.11');
  const glow=new THREE.Points(geometry,glowMaterial);glow.frustumCulled=false;scene.add(glow);
  // Airborne motes have their own scale, so the architectural cloud stays legible.
  const air=new THREE.BufferGeometry(),airPositions=[];
  for(let i=0;i<520;i++)airPositions.push((random()-.5)*5,random()*3.8,6-random()*32);
  air.setAttribute('position',new THREE.Float32BufferAttribute(airPositions,3));
  const airMaterial=new THREE.PointsMaterial({color:'#d8dfb2',size:.018,transparent:true,opacity:.4,depthWrite:false});
  const motes=new THREE.Points(air,airMaterial);scene.add(motes);
  let yaw=0,pitch=0,distance=16.3,hoverX=0,hoverY=0,drag=null,targetYaw=0,targetPitch=0,phase=0,disposed=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frameSamples=0,frameTotal=0;
  function reset(){targetYaw=0;targetPitch=0;distance=16.3;hoverX=hoverY=0;}
  canvas.addEventListener('pointerdown',e=>{canvas.focus({preventScroll:true});drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(drag){targetYaw=Math.max(-.35,Math.min(.35,targetYaw-(e.clientX-drag.x)*.002));targetPitch=Math.max(-.16,Math.min(.19,targetPitch+(e.clientY-drag.y)*.0015));drag={x:e.clientX,y:e.clientY};}else{hoverX=(e.clientX/innerWidth-.5)*.07;hoverY=(e.clientY/innerHeight-.5)*.035;}});
  const endDrag=()=>drag=null;canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);canvas.addEventListener('lostpointercapture',endDrag);canvas.addEventListener('pointerleave',()=>{hoverX=hoverY=0;});
  canvas.addEventListener('wheel',e=>{e.preventDefault();distance=Math.max(10.7,Math.min(19.5,distance+e.deltaY*.008));},{passive:false});
  canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')targetYaw+=.025;if(e.key==='ArrowRight')targetYaw-=.025;if(e.key==='ArrowUp')targetPitch-=.015;if(e.key==='ArrowDown')targetPitch+=.015;targetYaw=Math.max(-.35,Math.min(.35,targetYaw));targetPitch=Math.max(-.16,Math.min(.19,targetPitch));}});
  function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);const pw=Math.round(w*renderer.getPixelRatio()),ph=Math.round(h*renderer.getPixelRatio());bloomTarget.setSize(pw,ph);bloomMaterial.uniforms.texel.value.set(1/pw,1/ph);camera.aspect=w/h;camera.fov=w<650?64:53;camera.updateProjectionMatrix();uniforms.uScale.value=h*renderer.getPixelRatio()/(2*Math.tan(camera.fov*Math.PI/360));}
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  function render(dt,features,motion=.8){
    if(disposed)return;
    frameTotal+=dt;frameSamples++;
    if(frameSamples===180){if(frameTotal/frameSamples>.04&&renderer.getPixelRatio()>.85){renderer.setPixelRatio(Math.max(.85,renderer.getPixelRatio()-.15));resize();}frameSamples=0;frameTotal=0;}
    const smoothing=1-Math.exp(-dt*4);yaw+=((targetYaw+hoverX)-yaw)*smoothing;pitch+=((targetPitch+hoverY)-pitch)*smoothing;
    camera.position.set(Math.sin(yaw)*distance,1.72+Math.sin(pitch)*distance,-10+Math.cos(yaw)*distance);
    camera.lookAt(0,1.72,-10);
    phase+=dt*(.19+features.speed*2.1)*(reduced?.35:1);
    uniforms.uLow.value=features.low||0;uniforms.uMid.value=features.mid||0;uniforms.uHigh.value=features.high||0;uniforms.uPhase.value=phase;uniforms.uEnergy.value=features.energy;uniforms.uPulse.value=features.pulse;uniforms.uMotion.value=motion*(reduced?.3:1);
    motes.position.y=Math.sin(phase*.07)*.07;airMaterial.opacity=.28+features.energy*.2;
    renderer.setRenderTarget(bloomTarget);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(bloomScene,bloomCamera);
  }
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();document.getElementById('renderError').hidden=false;});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{document.getElementById('renderError').hidden=true;resize();});
  return {render,reset,count:positions.length/3,getCamera:()=>camera.position.toArray(),dispose(){disposed=true;observer.disconnect();bloomTarget.dispose();bloomMaterial.dispose();bloomQuad.geometry.dispose();geometry.dispose();material.dispose();glowMaterial.dispose();air.dispose();airMaterial.dispose();renderer.dispose();}};
}
