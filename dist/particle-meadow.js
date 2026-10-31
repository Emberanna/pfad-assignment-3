import * as THREE from './assets/three.module.js';
import {GLTFLoader} from './assets/GLTFLoader.js';
export async function buildMeadow(mobile=false){
  let seed=19871;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};
  const positions=[],colors=[],sizes=[],mobility=[],seeds=[],color=new THREE.Color();
  const density=mobile?.55:1;
  const height=(x,z)=>Math.sin(z*.042)*.7+Math.sin(x*.055+z*.025)*.7-.014*Math.max(0,-z);
  function put(x,y,z,c,size,group){if(rnd()>density)return;positions.push(x,y,z);colors.push(c.r,c.g,c.b);sizes.push(size*(.7+rnd()*.6));mobility.push(group);seeds.push(rnd()*100);}
  // Smaller, flat samples preserve the accepted yellow-green meadow palette.
  function grassColor(){const choice=rnd();if(choice<.13)color.setHSL(.145+rnd()*.035,.48,.43+rnd()*.1);else if(choice<.29)color.setHSL(.29+rnd()*.055,.38,.22+rnd()*.1);else color.setHSL(.19+rnd()*.045,.36+rnd()*.12,.40+rnd()*.12);}
  for(let i=0;i<165000;i++){const z=8-rnd()*115,x=(rnd()-.5)*130;grassColor();put(x,height(x,z)+(rnd()-.5)*.035,z,color,.023+rnd()*.012,0);}
  for(let i=0;i<94000;i++){const x=(rnd()-.5)*35,z=5.2-rnd()*40;grassColor();put(x,height(x,z)+(rnd()-.5)*.045,z,color,.025+rnd()*.014,0);}
  // Real tree topology is sampled into colored points; no solid model is rendered.
  const asset=await new GLTFLoader().loadAsync(new URL('./assets/nature/island_tree_02/model.gltf',import.meta.url).href);
  const root=asset.scene;root.scale.set(5.7,3.1,4);root.rotation.y=.9;root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root);root.position.set(5.3,height(5.3,-10)-bounds.min.y,-10);root.updateMatrixWorld(true);
  const p=new THREE.Vector3(),baseSamples=[];const baseY=height(5.3,-10);
  root.traverse(mesh=>{
    if(!mesh.isMesh)return;const g=mesh.geometry,pa=g.attributes.position,uv=g.attributes.uv,indices=g.index,mat=mesh.material;
    const foliage=/lea/i.test(mat.name),n=foliage?190000:70000;let data=null,w=0,h=0;
    if(mat.map?.image){const image=mat.map.image,c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);data=ctx.getImageData(0,0,c.width,c.height).data;w=c.width;h=c.height;}
    const triangleCount=(indices?indices.count:pa.count)/3;
    for(let j=0;j<n;j++){
      const t=Math.floor(rnd()*triangleCount)*3,a=indices?indices.getX(t):t,b=indices?indices.getX(t+1):t+1,c=indices?indices.getX(t+2):t+2;
      let u=rnd(),v=rnd();if(u+v>1){u=1-u;v=1-v;}const q=1-u-v;
      p.set(pa.getX(a)*q+pa.getX(b)*u+pa.getX(c)*v,pa.getY(a)*q+pa.getY(b)*u+pa.getY(c)*v,pa.getZ(a)*q+pa.getZ(b)*u+pa.getZ(c)*v).applyMatrix4(mesh.matrixWorld);
      if(data&&uv){const tx=uv.getX(a)*q+uv.getX(b)*u+uv.getX(c)*v,ty=uv.getY(a)*q+uv.getY(b)*u+uv.getY(c)*v;const ix=((Math.floor(tx*w)%w)+w)%w,iy=((Math.floor(ty*h)%h)+h)%h,index=(iy*w+ix)*4;if(data[index+3]<100)continue;color.setRGB(data[index]/255,data[index+1]/255,data[index+2]/255,THREE.SRGBColorSpace);color.multiplyScalar(foliage?2.2:1.5);color.r=Math.max(color.r,.035);color.g=Math.max(color.g,.045);color.b=Math.max(color.b,.025);}else color.set(foliage?'#abc777':'#c2ae87');
      put(p.x,p.y,p.z,color,foliage?.033:.024,1);
      if(!foliage&&p.y<baseY+1.45){const c=color.clone().multiplyScalar(1.3);put(p.x+(rnd()-.5)*.012,p.y,p.z+(rnd()-.5)*.012,c,.026,1);if(p.y<baseY+.45)baseSamples.push(p.clone());}
    }
  });
  // Root fans start at the sampled trunk foot and disappear into the same terrain surface.
  if(baseSamples.length){const foot=new THREE.Vector3();for(const sample of baseSamples)foot.add(sample);foot.multiplyScalar(1/baseSamples.length);
    for(let arm=0;arm<9;arm++){const angle=arm/9*Math.PI*2+rnd()*.25,length=.6+rnd()*1.25;
      for(let j=0;j<650;j++){const t=rnd(),a=rnd()*Math.PI*2,r=(1-t)*(.045+rnd()*.045),x=foot.x+Math.cos(angle)*length*t,z=foot.z+Math.sin(angle)*length*t;const y=height(x,z)+(1-t)*.14-.025*t+Math.sin(a)*r;color.set('#b4a17d');color.multiplyScalar(.65+rnd()*.45);put(x+Math.cos(a)*r,y,z,color,.022,1);}
    }
  }
  for(let i=0;i<65;i++){
    const x=(rnd()-.5)*160,z=-45-rnd()*90,base=height(x,z),treeHeight=3+rnd()*7;
    for(let j=0;j<2400;j++){const a=rnd()*6.283,v=rnd()*2-1,r=Math.cbrt(rnd()),ring=Math.sqrt(1-v*v);color.setHSL(.22+rnd()*.07,.3,.37+rnd()*.17);put(x+Math.cos(a)*ring*r*4,base+treeHeight*.65+v*r*treeHeight*.45,z+Math.sin(a)*ring*r*3,color,.055,1);}
    for(let j=0;j<230;j++){const t=rnd(),a=rnd()*Math.PI*2;color.set('#b9ac8b');color.multiplyScalar(.7+rnd()*.3);put(x+Math.cos(a)*.13,base+t*treeHeight*.65,z+Math.sin(a)*.13,color,.039,1);}
  }
  // Small, static pale-gold points form a horizon veil that thins into the dark upper sky.
  for(let i=0;i<85000;i++){
    const x=(rnd()-.5)*340,z=-155-rnd()*75,y=-3+Math.pow(rnd(),2)*39,t=Math.max(0,(y+3)/39);
    if(rnd()>1-t*.8)continue;color.set('#d9c793');color.lerp(new THREE.Color('#302732'),Math.pow(t,.7));
    put(x,y,z,color,.14+rnd()*.08,3);
  }
  // Sparse ground-level flecks create detail without lifting the meadow into a cloud of motes.
  for(let i=0;i<9000;i++){
    const x=(rnd()-.5)*28,z=5-rnd()*31;color.set(rnd()<.55?'#c7b969':'#4d7049');
    put(x,height(x,z)+.012+rnd()*.025,z,color,.012+rnd()*.009,0);
  }
  for(let i=0;i<1500;i++){const x=(rnd()-.5)*33,z=8-rnd()*25;color.set(rnd()<.7?'#e1e3c2':'#b8c9e0');put(x,height(x,z)+.3+rnd()*.35,z,color,.045,1);}
  return{positions,colors,sizes,mobility,seeds};
}
