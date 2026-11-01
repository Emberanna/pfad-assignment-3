// Continuous audio-driven inertial envelopes; no timed burst, hold or cooldown cycle.
const clamp=x=>Math.max(0,Math.min(1,x));
const follow=(a,b,dt,rate)=>a+(b-a)*(1-Math.exp(-dt*rate));
export class ExpressiveMotion{
  constructor(){this.previous=new Float32Array(1024);this.output={};this.reset();}
  reset(){this.previous.fill(0);this.peak=.025;this.sustain=0;this.fluxMean=.003;this.fluxVariance=.00002;this.lastEnergy=0;this.pulseMemory=0;this.impulse=0;this.warmup=0;this.triggerCount=0;this.wasNovel=false;
    Object.assign(this.output,{flow:0,burst:0,drive:0,novelty:0,level:'Calm',normalizedEnergy:0,flowFast:0,flowSlow:0,burstFast:0,burstSlow:0,driveSlow:0});
    this.flowVelocity=0;this.burstVelocity=0;
  }
  spring(key,velocityKey,target,dt,frequency){
    // Exact critically damped spring: stable through variable rendering intervals.
    const x=this.output[key]-target,v=this[velocityKey],decay=Math.exp(-frequency*dt),c=v+frequency*x;
    this.output[key]=Math.max(0,target+(x+c*dt)*decay);this[velocityKey]=(v-frequency*c*dt)*decay;
  }
  update(wave,spectrum,dt,features,active=true){
    dt=Math.min(.1,Math.max(.001,dt));const out=this.output;let energy=0,novelty=0,flowTarget=0,burstTarget=0;
    if(active){
      this.warmup+=dt;let sum=0;for(let i=0;i<wave.length;i++)sum+=wave[i]*wave[i];const rms=Math.sqrt(sum/Math.max(1,wave.length));
      this.peak=Math.max(.012,rms,this.peak*Math.exp(-dt/18));const audible=clamp((rms-.0025)/.012);
      energy=clamp(rms/Math.max(.012,this.peak))*audible;this.sustain=follow(this.sustain,energy,dt,energy>this.sustain?1.7:.65);
      let flux=0;const bins=Math.min(spectrum.length,this.previous.length);for(let i=2;i<bins;i++){const v=spectrum[i]/255;flux+=Math.max(0,v-this.previous[i]);this.previous[i]=v;}flux/=Math.max(1,bins-2);
      const z=clamp((flux-this.fluxMean)/(Math.sqrt(Math.max(.000001,this.fluxVariance))*2.8+.003));
      const rise=clamp((energy-this.lastEnergy)*3);this.lastEnergy=energy;const delta=flux-this.fluxMean,k=1-Math.exp(-dt/2);this.fluxMean+=delta*k;this.fluxVariance+=(delta*delta-this.fluxVariance)*k;
      const beat=features.pulse||0,speed=features.speed||0;this.pulseMemory=follow(this.pulseMemory,beat,dt,beat>this.pulseMemory?7:1.4);
      novelty=Math.max(z,rise,beat*.85);const event=novelty>.6&&this.sustain>.32;
      if(event&&!this.wasNovel)this.triggerCount++;this.wasNovel=event;
      // Rhythmic changes add momentum to existing flow; they do not start a new animation.
      this.impulse=follow(this.impulse,novelty*clamp((this.sustain-.2)*2),dt,novelty>this.impulse?6:1.0);
      const activity=clamp(speed*.85+this.pulseMemory*.4+z*.15);
      flowTarget=clamp((this.sustain-.18)*1.7)*(.2+.8*activity)*audible;
      const rhythm=clamp((speed-.23)*1.7+this.impulse*.7);
      burstTarget=clamp((this.sustain-.25)*2.0)*rhythm*(.62+this.impulse*.38)*audible;
      if(this.warmup<1.5)burstTarget*=this.warmup/1.5;
    }else{this.sustain*=Math.exp(-dt*1.1);this.impulse*=Math.exp(-dt*1.3);this.previous.fill(0);this.lastEnergy=0;this.wasNovel=false;}
    this.spring('flow','flowVelocity',flowTarget,dt,3.0);this.spring('burst','burstVelocity',burstTarget,dt,2.4);
    out.drive=follow(out.drive,energy,dt,energy>out.drive?4:1.0);
    out.flowFast=follow(out.flowFast,out.flow,dt,3.8);out.flowSlow=follow(out.flowSlow,out.flow,dt,.95);
    out.burstFast=follow(out.burstFast,out.burst,dt,3.4);out.burstSlow=follow(out.burstSlow,out.burst,dt,.72);
    out.driveSlow=follow(out.driveSlow,out.drive,dt,.75);out.novelty=novelty;out.normalizedEnergy=energy;
    if(out.burst>.28||(out.level==='Burst'&&out.burst>.18))out.level='Burst';else if(out.flow>.22||(out.level==='Flow'&&out.flow>.14))out.level='Flow';else out.level='Calm';return out;
  }
}
