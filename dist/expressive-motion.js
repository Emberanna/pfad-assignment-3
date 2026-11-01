const clamp=x=>Math.max(0,Math.min(1,x));
const follow=(a,b,dt,tau)=>b+(a-b)*Math.exp(-dt/tau);
// Music changes local activity, never a timed scatter/reassembly state.
export class ExpressiveMotion{
 constructor(){this.output={};this.reset();}
 reset(){this.triggerCount=0;Object.assign(this.output,{oscillatorRate:1,rms:0,smoothedEnergy:0,motionAmplitude:0,structuralRelease:0,flow:0,burst:0,drive:0,flowFast:0,flowSlow:0,burstFast:0,burstSlow:0,driveSlow:0});}
 update(wave,spectrum,dt,features={},active=true){
 dt=Math.max(0,Math.min(.5,dt));const o=this.output;let rms=0;
 if(active&&wave){for(const x of wave)rms+=x*x;rms=Math.sqrt(rms/Math.max(1,wave.length));}
 // Fixed logarithmic range suited to the provided recording; no recent-peak normalization.
 const energy=active?clamp(Math.log1p(rms/.006)/Math.log1p(.12/.006)):0;
 const audible=active?clamp((rms-.0005)/.0025):0;
 o.rms=rms;o.smoothedEnergy=follow(o.smoothedEnergy,energy,dt,energy>o.smoothedEnergy?.22:.45);
 const target=audible*(.035+.9*o.smoothedEnergy);
 o.motionAmplitude=follow(o.motionAmplitude,target,dt,target>o.motionAmplitude?.28:.48);
 // Compatibility metric now means small local looseness, not structural dissolution.
 o.structuralRelease=follow(o.structuralRelease,active?o.smoothedEnergy*.2*audible:0,dt,.6);
 if(o.motionAmplitude<1e-5&&o.structuralRelease<1e-5&&(!active||rms<.0005)){o.motionAmplitude=0;o.structuralRelease=0;}
 o.oscillatorRate=1;o.flow=o.flowFast=o.flowSlow=o.motionAmplitude;
 o.burst=o.burstFast=o.burstSlow=o.structuralRelease;o.drive=o.driveSlow=o.smoothedEnergy;o.normalizedEnergy=energy;return o;
 }
}
