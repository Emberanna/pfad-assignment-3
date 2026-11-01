// One immutable attribute tuple per point, independent of shared blade/crown seeds.
export function createIndividualAttributes(count){
  const data=new Float32Array(count*4);let state=270119;
  const random=()=>{state=(Math.imul(state,1664525)+1013904223)|0;return(state>>>0)/4294967296;};
  for(let i=0;i<count;i++){const k=i*4;data[k]=random()*Math.PI*2;data[k+1]=.65+random()*.75;data[k+2]=random();data[k+3]=.6+random()*.85;}return data;
}
export const individualMotionGLSL=`
  // Local trajectories share a continuous clock, never a shared displacement.
  float lag=aIndividual.z;
  float flow=mix(uFlowFast,uFlowSlow,lag);
  float loosen=mix(uBurstFast,uBurstSlow,lag);
  float drive=mix(uDrive,uDriveSlow,lag);
  float sensitivity=aIndividual.y;
  float strength=step(.001,aMotionWeight)*uMotion*sensitivity;
  float t=uPhase*aIndividual.w,phase=aIndividual.x;
  float low=min(1.0,uLow*4.0),mid=min(1.0,uMid*3.0),high=min(1.0,uHigh*7.0);
  float separation=smoothstep(.06+pick*.20,.40+pick*.32,flow*.55+loosen*.95);
  vec3 direction=normalize(vec3(sin(phase*2.31+.7),cos(phase*3.17+.4)*.8,sin(phase*4.13+2.1)));
  vec3 drift=vec3(sin(t*.73+phase),sin(t*.91+phase*2.17),cos(t*.61+phase*3.31));
  vec3 curl=vec3(cos(t*.47+phase*2.7+position.z*.04),sin(t*.63+phase*3.9+position.x*.05),sin(t*.81+phase*1.6));
  float range=(.35+flow*(.7+mid*.8)+loosen*(2.2+pick2*5.0))*(.35+.65*separation);
  vec3 offset=(drift*.68+curl*.32)*range*(flow*.65+loosen*.8);
  offset+=direction*loosen*separation*(.5+pick2*2.8)*(1.0+low*.4);
  offset.y+=(pick-.42)*loosen*(.6+pick2*1.6);
  // Breathing remains particle-specific, and all terms decay back to the rest pose.
  offset+=drift*drive*.025;
  offset+=vec3(sin(t*2.3+phase),cos(t*2.9+phase*2.0),sin(t*1.7+phase*4.0))*high*.07*flow;
  p+=offset*strength;
  vBokeh=smoothstep(.92,.995,pick)*loosen*step(.001,aMotionWeight);
`;
