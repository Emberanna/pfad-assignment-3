import * as THREE from './assets/three.module.js';
import {buildMeadow} from './particle-meadow.js';

// The scene is generated in three dimensions, without photographs or scanned assets.
export async function createGarden(canvas) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias:false, alpha:false, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.4));
  renderer.setClearColor('#302732');
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();
  // Scene lights are the source of the particle shader's illumination uniforms.
  const sunset=new THREE.DirectionalLight('#ffe2b9',1.6);
  sunset.position.set(-65,16,-70);sunset.target.position.set(0,0,-15);
  const fill=new THREE.HemisphereLight('#c6d4e1','#6e7757',.82);
  scene.add(sunset,sunset.target,fill);
  const lightDirection=new THREE.Vector3();
  function updateLighting(){
    lightDirection.subVectors(sunset.position,sunset.target.position).normalize();
    uniforms.uSunDirection.value.copy(lightDirection);
    uniforms.uSunColor.value.copy(sunset.color).multiplyScalar(sunset.intensity);
    uniforms.uSkyColor.value.copy(fill.color).multiplyScalar(fill.intensity);
    uniforms.uGroundColor.value.copy(fill.groundColor).multiplyScalar(fill.intensity);
  }
  const bloomTarget=new THREE.WebGLRenderTarget(1,1,{depthBuffer:true});
  const bloomScene=new THREE.Scene(),bloomCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const bloomMaterial=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{image:{value:bloomTarget.texture},texel:{value:new THREE.Vector2(1,1)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',fragmentShader:`uniform sampler2D image;uniform vec2 texel;varying vec2 vUv;
    void main(){vec3 base=texture2D(image,vUv).rgb;vec3 halo=vec3(0.0);
      for(int x=-1;x<=1;x++){for(int y=-1;y<=1;y++){vec3 c=texture2D(image,vUv+vec2(float(x),float(y))*texel*3.0).rgb;halo+=max(c-vec3(0.48),vec3(0.0));}}
      gl_FragColor=vec4(base+halo*0.025,1.0);
      #include <colorspace_fragment>
    }`});
  const bloomQuad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),bloomMaterial);bloomScene.add(bloomQuad);
  // A quiet sky gradient behind the existing point cloud; no sun mesh or light particles.
  const skyMaterial=new THREE.ShaderMaterial({depthWrite:false,depthTest:false,
    uniforms:{warm:{value:new THREE.Color('#d5ae84')},upper:{value:new THREE.Color('#474653')},lower:{value:new THREE.Color('#302732')}},
    vertexShader:'varying vec2 uvSky;void main(){uvSky=uv;gl_Position=vec4(position.xy,0.9999,1.0);}',
    fragmentShader:`uniform vec3 warm,upper,lower;varying vec2 uvSky;void main(){
      float horizon=smoothstep(.30,.57,uvSky.y)*(1.0-smoothstep(.57,1.03,uvSky.y));
      vec3 c=mix(lower,upper,smoothstep(.5,1.0,uvSky.y));
      c=mix(c,warm,horizon*.40);gl_FragColor=vec4(c,1.0);
    }`});
  const sky=new THREE.Mesh(new THREE.PlaneGeometry(2,2),skyMaterial);sky.frustumCulled=false;sky.renderOrder=-100;scene.add(sky);
  const camera=new THREE.PerspectiveCamera(53,1,.08,320);
  const {positions,colors,sizes,mobility,seeds,terrainHeight}=await buildMeadow(innerWidth<650);
  let moteSeed=913;const random=()=>{moteSeed=(Math.imul(moteSeed,1664525)+1013904223)|0;return(moteSeed>>>0)/4294967296;};
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setAttribute('aSize',new THREE.Float32BufferAttribute(sizes,1));
  geometry.setAttribute('aMobility',new THREE.Float32BufferAttribute(mobility,1));
  geometry.setAttribute('aSeed',new THREE.Float32BufferAttribute(seeds,1));
  // Static, approximate surface normals: terrain gradients for grass and radial
  // plant normals for the sampled tree. No per-frame CPU particle updates.
  const normals=new Float32Array(sizes.length*3),tips=new Float32Array(sizes.length),exposure=new Float32Array(sizes.length);
  const n=new THREE.Vector3();
  for(let i=0;i<sizes.length;i++){
    const k=i*3,x=positions[k],y=positions[k+1],z=positions[k+2],ground=terrainHeight(x,z);
    if(mobility[i]===0){
      n.set(-(terrainHeight(x+.1,z)-terrainHeight(x-.1,z))/.2,1,-(terrainHeight(x,z+.1)-terrainHeight(x,z-.1))/.2).normalize();
      tips[i]=THREE.MathUtils.smoothstep(y-ground,.16,.85);
    }else{n.set((x-5.3)*.14,(y-ground-3)*.09,(z+10)*.14).normalize();if(n.lengthSq()<.01)n.set(0,1,0);}
    n.toArray(normals,k);
    // Broad exposure transition, not a projected canopy shadow (Stage 3.3).
    const open=1-.48*Math.exp(-((x-5.3)**2/70+(z+10)**2/100));
    const middle=.52+.48*(1-Math.exp(-Math.max(0,6-z)/24));
    exposure[i]=open*middle;
  }
  geometry.setAttribute('aLightNormal',new THREE.BufferAttribute(normals,3));
  geometry.setAttribute('aGrassTip',new THREE.BufferAttribute(tips,1));
  geometry.setAttribute('aExposure',new THREE.BufferAttribute(exposure,1));
  // Fixed-light point-cloud depth map: vegetation casts onto the same 3D terrain.
  // Shadow casters use the accepted rest pose; music displacement remains unchanged.
  const shadowTarget=new THREE.WebGLRenderTarget(2048,2048,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:true});
  const shadowCamera=new THREE.OrthographicCamera(-58,58,46,-46,1,260);
  const shadowFocus=new THREE.Vector3(0,0,-32),sunVector=new THREE.Vector3().subVectors(sunset.position,sunset.target.position).normalize();
  shadowCamera.position.copy(shadowFocus).addScaledVector(sunVector,125);shadowCamera.lookAt(shadowFocus);shadowCamera.updateMatrixWorld(true);
  const shadowMatrix=new THREE.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(shadowCamera.projectionMatrix).multiply(shadowCamera.matrixWorldInverse);
  const shadowMaterial=new THREE.ShaderMaterial({
    vertexShader:`attribute float aMobility;varying float vCaster;void main(){vCaster=1.0-step(2.5,aMobility);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=mix(1.4,2.2,step(.5,aMobility));}`,
    fragmentShader:`#include <packing>
      varying float vCaster;void main(){if(vCaster<.5||length(gl_PointCoord-.5)>.5)discard;gl_FragColor=packDepthToRGBA(gl_FragCoord.z);}`});
  const shadowScene=new THREE.Scene();shadowScene.background=new THREE.Color(1,1,1);const casters=new THREE.Points(geometry,shadowMaterial);casters.frustumCulled=false;shadowScene.add(casters);
  renderer.setRenderTarget(shadowTarget);renderer.render(shadowScene,shadowCamera);renderer.setRenderTarget(null);
  const uniforms={uDaylight:{value:1},uLow:{value:0},uMid:{value:0},uHigh:{value:0},uPhase:{value:0},uEnergy:{value:0},uScale:{value:800},uMotion:{value:.8},uPulse:{value:0},uFog:{value:new THREE.Color('#302732')},uShadowMap:{value:shadowTarget.texture},uShadowMatrix:{value:shadowMatrix},uSunDirection:{value:new THREE.Vector3()},uSunColor:{value:new THREE.Color()},uSkyColor:{value:new THREE.Color()},uGroundColor:{value:new THREE.Color()}};
  updateLighting();
  const material=new THREE.ShaderMaterial({
    uniforms,vertexColors:true,transparent:true,depthWrite:true,depthTest:true,
    vertexShader:`attribute vec3 aLightNormal;attribute float aGrassTip,aExposure;
      uniform float uDaylight;uniform vec3 uSunDirection,uSunColor,uSkyColor,uGroundColor;
      uniform mat4 uShadowMatrix;varying vec3 shadowPosition;
      attribute float aSize;attribute float aMobility;attribute float aSeed;
      uniform float uPhase,uEnergy,uScale,uMotion,uPulse,uLow,uMid,uHigh;varying vec3 vColor;varying vec3 ambientColor;varying vec3 unlitColor;varying float vPlantOpacity;varying float vDistance;
      void main(){vec3 p=position;float wave=uPhase+aSeed;
        float grass=1.0-step(0.5,aMobility);float haze=step(2.5,aMobility);float sparkle=step(1.5,aMobility)*(1.0-haze);float amp=(grass*(0.008+uLow*0.10)+(1.0-grass)*(0.018+uMid*0.14))*uMotion*(1.0-haze);
        p.x+=sin(wave+p.z*0.6)*amp;p.y+=cos(wave*0.83+p.x*0.8)*amp*0.7;p.z+=sin(wave*0.63+p.y)*amp*0.65;
        vec4 mv=modelViewMatrix*vec4(p,1.0);vDistance=-mv.z;
        gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(aSize*uScale*(1.05+uEnergy*0.65)/max(0.1,-mv.z),mix(1.1,0.65,haze),mix(mix(8.0,22.0,step(0.5,aMobility)),2.0,haze));
        vec3 N=normalize(mat3(modelMatrix)*aLightNormal);
        vec3 worldPosition=(modelMatrix*vec4(p,1.0)).xyz;
        shadowPosition=(uShadowMatrix*vec4(worldPosition,1.0)).xyz;
        float diffuse=max(dot(N,uSunDirection),0.0);
        vec3 ambient=mix(uGroundColor,uSkyColor,N.y*.5+.5)*.78;
        vec3 viewDirection=normalize(cameraPosition-worldPosition);
        float forward=pow(max(dot(-uSunDirection,viewDirection),0.0),3.0);
        float tipLight=aGrassTip*grass*(.18+.65*forward)*aExposure;
        vec3 lighting=ambient+uSunColor*(diffuse*aExposure*.92+tipLight*.55);
        lighting=mix(lighting,vec3(1.0),haze);
        unlitColor=color*(1.08+uEnergy*0.08+sparkle*uHigh*(0.4+0.4*sin(wave*3.0)));
        vPlantOpacity=(1.0-grass)*(1.0-haze);
        ambientColor=color*mix(ambient,vec3(1.0),haze);
        vColor=color*lighting*(1.08+uEnergy*0.08+sparkle*uHigh*(0.4+0.4*sin(wave*3.0)));
      }`,
    fragmentShader:`#include <packing>
      uniform float uDaylight;uniform sampler2D uShadowMap;varying vec3 shadowPosition;
      uniform vec3 uFog;varying vec3 vColor;varying vec3 ambientColor;varying vec3 unlitColor;varying float vPlantOpacity;varying float vDistance;
      void main(){vec2 uv=gl_PointCoord*2.0-1.0;float r=dot(uv,uv);if(r>1.0)discard;
        float alpha=min(1.0,exp(-r*1.5)*.95);float fog=1.0-exp(-vDistance*vDistance*0.000025);
        float visibility=1.0;
        if(uDaylight>.5&&shadowPosition.x>0.0&&shadowPosition.x<1.0&&shadowPosition.y>0.0&&shadowPosition.y<1.0&&shadowPosition.z>0.0&&shadowPosition.z<1.0){
          visibility=0.0;
          for(int sx=-1;sx<=1;sx++)for(int sy=-1;sy<=1;sy++){
            float depth=unpackRGBAToDepth(texture2D(uShadowMap,shadowPosition.xy+vec2(float(sx),float(sy))/2048.0));
            visibility+=step(shadowPosition.z-.0008,depth)/9.0;
          }
        }
        vec3 shaded=mix(unlitColor,mix(ambientColor,vColor,.35+.65*visibility),uDaylight);
        gl_FragColor=vec4(mix(shaded,uFog,fog),alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const cloud=new THREE.Points(geometry,material);cloud.frustumCulled=false;scene.add(cloud);
  const glowMaterial=material.clone();glowMaterial.uniforms=uniforms;glowMaterial.depthWrite=false;glowMaterial.blending=THREE.AdditiveBlending;
  glowMaterial.vertexShader=glowMaterial.vertexShader.replace('vColor=color*','gl_PointSize*=mix(1.35,1.9,step(0.5,aMobility));vColor=color*');
  glowMaterial.fragmentShader=glowMaterial.fragmentShader.replace('float alpha=min','float alpha=.12*min').replace('1.5','mix(3.8,2.4,vPlantOpacity*uDaylight)');
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
    updateLighting();
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
  function setTimeOfDay(mode){
    const daylight=mode==='dusk';uniforms.uDaylight.value=daylight?1:0;sky.visible=daylight;
  }
  return {render,reset,setTimeOfDay,count:positions.length/3,getCamera:()=>camera.position.toArray(),dispose(){disposed=true;observer.disconnect();shadowTarget.dispose();shadowMaterial.dispose();sky.geometry.dispose();skyMaterial.dispose();bloomTarget.dispose();bloomMaterial.dispose();bloomQuad.geometry.dispose();geometry.dispose();material.dispose();glowMaterial.dispose();air.dispose();airMaterial.dispose();renderer.dispose();}};
}
