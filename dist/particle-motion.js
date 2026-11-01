// One immutable attribute tuple per point, independent of shared blade/crown seeds.
export function createIndividualAttributes(count){
  const data=new Float32Array(count*4);let state=270119;
  const random=()=>{state=(Math.imul(state,1664525)+1013904223)|0;return(state>>>0)/4294967296;};
  for(let i=0;i<count;i++){const k=i*4;data[k]=random()*Math.PI*2;data[k+1]=.65+random()*.75;data[k+2]=random();data[k+3]=.6+random()*.85;}return data;
}
export function sampleMotion(a,group,time,amplitude,release,motion=1,weight=1){
 const [phase,sensitivity,pick,frequency]=a,grass=group<.5,vertical=pick>(grass?.28:.75);
 const raw=[vertical?.22*Math.sin(phase*2.31):1,vertical?1:.23*Math.sin(phase*3.17),0];
 const norm=Math.hypot(...raw),axis=raw.map(x=>x/norm);
 const range=(grass?1.2:2.2)*amplitude+release*release*(grass?7:14);
 const extent=range*(.65+pick*.7)*sensitivity*motion*(group>2.5?0:1)*(group===1&&weight<.1?1.7:1);
 return {axis,extent,offset:axis.map(x=>x*extent*Math.sin(time*frequency*1.6+phase))};
}
export const individualMotionGLSL=`
 float flow=uAmplitude,loosen=uRelease;
 float strength=step(.001,aMotionWeight)*uMotion;
 float phase=aIndividual.x;
 bool vertical=aIndividual.z>mix(.75,.28,grass);
 vec3 axis=normalize(vec3(vertical?.22*sin(phase*2.31):1.0,vertical?1.0:.23*sin(phase*3.17),0.0));
 float range=mix(2.2,1.2,grass)*uAmplitude+uRelease*uRelease*mix(14.0,7.0,grass);
 float extent=range*(.65+aIndividual.z*.7)*aIndividual.y*strength*(aMobility>.5&&aMobility<1.5&&aMotionWeight<.1?1.7:1.0);
 p+=axis*(extent*sin(uPhase*aIndividual.w*1.6+phase));
`;
