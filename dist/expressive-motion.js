const clamp=x=>Math.max(0,Math.min(1,x));
const follow=(a,b,dt,tau)=>b+(a-b)*Math.exp(-dt/tau);
export class ExpressiveMotion{
 constructor(){this.output={};this.reset();}
 reset(){this.sustain=0;this.fastRhythm=0;this.triggerCount=0;Object.assign(this.output,{oscillatorRate:1,rms:0,smoothedEnergy:0,motionAmplitude:0,structuralRelease:0,flow:0,burst:0,drive:0,flowFast:0,flowSlow:0,burstFast:0,burstSlow:0,driveSlow:0});}
 update(wave,spectrum,dt,features={},active=true){
 dt=Math.max(0,Math.min(.5,dt));const o=this.output;let rms=0;
 if(active&&wave){for(const x of wave)rms+=x*x;rms=Math.sqrt(rms/Math.max(1,wave.length));}
 // Absolute dBFS calibration: no peak normalization of quiet passages.
 const energy=active?clamp((20*Math.log10(Math.max(1e-8,rms))+48)/42):0;
 o.rms=rms;o.smoothedEnergy=follow(o.smoothedEnergy,energy,dt,energy>o.smoothedEnergy?.18:.7);
 this.sustain=follow(this.sustain,o.smoothedEnergy,dt,o.smoothedEnergy>this.sustain?3:1.1);
 const audible=active?clamp(rms/.003):0;
 const amplitude=audible*(.035+.5*o.smoothedEnergy+.16*o.smoothedEnergy*clamp(features.pulse||0));
 const high=clamp((this.sustain-.54)/.22);
 // Require continuous fast activity, not a single pulse. Weak music keeps its existing response.
 const fast=active&&features.ready!==false?clamp(((features.speed||0)-.52)/.28):0;
 this.fastRhythm=follow(this.fastRhythm,fast,dt,fast>this.fastRhythm?1.1:.6);
 const gate=clamp((o.smoothedEnergy-.50)/.18);
 const rhythmicRelease=this.fastRhythm*this.fastRhythm*gate;
 const release=Math.max(high*high*(3-2*high),rhythmicRelease);
 o.oscillatorRate=follow(o.oscillatorRate,1+3*this.fastRhythm*gate,dt,.3);
 o.motionAmplitude=follow(o.motionAmplitude,amplitude,dt,amplitude>o.motionAmplitude?.16:.65);
 o.structuralRelease=follow(o.structuralRelease,active?release:0,dt,release>o.structuralRelease?1.8:.85);
 if(!active&&o.motionAmplitude<1e-5&&o.structuralRelease<1e-5){o.motionAmplitude=0;o.structuralRelease=0;}
 o.flow=o.flowFast=o.flowSlow=o.motionAmplitude;o.burst=o.burstFast=o.burstSlow=o.structuralRelease;
 o.drive=o.driveSlow=o.smoothedEnergy;o.normalizedEnergy=energy;return o;
 }
}
