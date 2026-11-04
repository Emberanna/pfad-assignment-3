import {CatmullRomCurve3, Color, Vector3} from './assets/three.module.js';

export async function buildArbor(mobile=false) {
  const positions=[], colors=[], sizes=[], mobility=[], seeds=[], motionWeights=[];
  let state=1627;
  const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
  const count=n=>Math.floor(n*(mobile?.58:1));
  const color=new Color();
  const terrainHeight=(x,z)=>.12*Math.sin(x*.35)*Math.cos(z*.23)+.25*Math.exp(-((x+5)**2+(z+4)**2)/16);
  function point(x,y,z,h,s,l,size,group,weight=1){
    color.setHSL(h,s,l);
    positions.push(x,y,z);colors.push(color.r,color.g,color.b);
    sizes.push(size);mobility.push(group);seeds.push(random()*100);motionWeights.push(weight);
  }

  // Stems have individual roots and flower spikes distributed over a surface in world space.
  for(let i=0;i<count(21000);i++){
    const x=(random()-.5)*42,z=5-random()*48,y=terrainHeight(x,z);
    const flower=random()<.78+.12*Math.sin(x*.45+z*.6);
    const tall=.20+random()*.48,lean=(random()-.5)*.24;
    const hue=.70+random()*.15;
    for(let j=0;j<10;j++){
      const t=j/9,petal=flower&&t>.32;
      const spread=petal?.048*(1-t)+.012:.024;
      point(x+lean*t*t+(random()-.5)*spread,y+t*tall,z+(random()-.5)*spread,
        petal?hue:.24+random()*.08,petal?.48:.49,petal?.41+random()*.26:.17+random()*.19,
        petal?.026+random()*.012:.022,0,petal?.8:.44);
    }
  }

  // Bark follows tapered, branching tubes with irregular ridges and moss at their bases.
  function limb(nodes,radius,tip,samples){
    const curve=new CatmullRomCurve3(nodes.map(v=>new Vector3(...v)));
    const steps=64,frames=curve.computeFrenetFrames(steps,false);
    const center=new Vector3();
    for(let i=0;i<count(samples);i++){
      const t=random(),a=random()*Math.PI*2,k=Math.min(steps,Math.round(t*steps));
      curve.getPointAt(t,center);
      const r=(tip+(radius-tip)*(1-t)**1.18)*(1+.11*Math.sin(a*9+t*18)+.08*Math.sin(a*4-t*25));
      center.addScaledVector(frames.normals[k],Math.cos(a)*r).addScaledVector(frames.binormals[k],Math.sin(a)*r);
      const moss=random()<.2*(1-t)+.12*Math.max(0,Math.sin(a*2+t*20));
      point(center.x,center.y,center.z,moss?.23:.08,moss?.5:.27,
        moss?.18+random()*.15:.12+random()*.23,.028+random()*.031,1,.025);
    }
  }

  function crown(x,y,z,rx,ry,rz,samples){
    for(let i=0;i<count(samples);i++){
      const a=random()*Math.PI*2,v=2*random()-1,r=Math.cbrt(random()),ring=Math.sqrt(1-v*v);
      const lobe=1+.18*Math.sin(a*5+v*4);
      point(x+Math.cos(a)*r*ring*rx*lobe,y+v*r*ry,z+Math.sin(a)*r*ring*rz*lobe,
        .19+random()*.11,.39+random()*.24,.22+.16*(v+1)/2+random()*.17,.036+random()*.047,1,.83);
    }
  }

  function tree(x,z,scale,lean,phase){
    const y=terrainHeight(x,z);
    const at=(dx,dy,dz)=>[x+dx*scale,y+dy*scale,z+dz*scale];
    limb([at(0,0,0),at(lean*.3,2.2,.15),at(lean,4.8,-.18),at(lean*.7,8.8,-.4)],scale*.68,scale*.16,19000);
    for(let i=0;i<5;i++){
      const angle=phase+i*2.399,dx=Math.cos(angle),dz=Math.sin(angle),h=3.4+i*.62;
      limb([at(lean*.75,h,0),at(lean+dx*1.55,h+1.15,dz),at(lean+dx*3.7,h+2.8,dz*2.55)],scale*.36,scale*.04,6500);
      for(let j=0;j<3;j++){
        const a=angle+(j-1)*.65;
        crown(...at(lean+Math.cos(a)*(3.1+j*.47),h+2.65+j*.32,Math.sin(a)*2.7),2.3*scale,1.35*scale,1.8*scale,2700);
      }
    }
    for(let i=0;i<5;i++){
      const a=phase+i*1.2566,dx=Math.cos(a),dz=Math.sin(a);
      limb([at(0,.43,0),at(dx*.82,.18,dz*.82),at(dx*1.65,.02,dz*1.65)],scale*.26,scale*.028,850);
    }
  }
  tree(4.8,-7.5,1.42,-.35,.4);
  tree(-4.2,-11,1.2,-1.05,2.3);
  tree(-7.2,-4.5,.83,1.4,1);
  tree(8.9,-17,.94,-.85,2);
  tree(-1,-24,.82,.8,1.7);
  for(let i=0;i<10;i++){
    const x=(random()-.5)*44,z=-24-random()*34,y=terrainHeight(x,z),h=4+random()*5;
    limb([[x,y,z],[x+.35,y+h*.55,z],[x-.55,y+h,z-.5]],.31,.055,2100);
    crown(x,y+h,z,2.9,2.6,2.5,4100);
  }
  return {positions,colors,sizes,mobility,seeds,motionWeights,terrainHeight};
}
