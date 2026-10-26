// Estimates local rhythmic activity from spectral onsets; does not claim score BPM.
export class AudioFeatures {
  constructor(){this.reset();}
  reset(){this.energy=0;this.speed=0;this.pulse=0;this.previous=null;this.fluxHistory=[];this.onsets=[];this.lastOnset=-10;this.lastSample=-1;this.startedAt=null;this.activity=0;}
  update(wave,spectrum,time,dt,gain=1,rhythm=null){
    if(this.startedAt===null)this.startedAt=time;
    let sum=0;for(let i=0;i<wave.length;i++)sum+=wave[i]*wave[i];
    const rms=Math.sqrt(sum/Math.max(1,wave.length));
    const targetEnergy=Math.min(1,Math.max(0,(Math.sqrt(rms)*1.7-.035)*gain));
    this.energy+=(targetEnergy-this.energy)*(1-Math.exp(-dt*(targetEnergy>this.energy?12:4)));
    this.pulse*=Math.exp(-dt*9);
    if(rhythm){this.speed+=(rhythm.speed-this.speed)*(1-Math.exp(-dt*2));this.pulse=rhythm.pulse;return{energy:this.energy,speed:this.speed,pulse:this.pulse,ready:rhythm.ready};}
    if(time-this.lastSample>=.023){
      this.lastSample=time;
      const bins=Math.min(spectrum.length,430),current=new Float32Array(bins);let flux=0;
      for(let i=3;i<bins;i++){current[i]=Math.log1p(spectrum[i]/18);if(this.previous)flux+=Math.max(0,current[i]-this.previous[i]);}
      flux/=Math.max(1,bins-3);this.previous=current;
      this.fluxHistory=this.fluxHistory.filter(x=>time-x.t<1.7);
      const history=this.fluxHistory.map(x=>x.v),mean=history.reduce((a,b)=>a+b,0)/Math.max(1,history.length);
      const deviation=Math.sqrt(history.reduce((a,b)=>a+(b-mean)**2,0)/Math.max(1,history.length));
      const threshold=Math.max(.018,mean+deviation*.85);
      if(rms>.006&&flux>threshold&&time-this.lastOnset>.23&&history.length>5){this.onsets.push(time);this.lastOnset=time;this.pulse=1;}
      this.fluxHistory.push({t:time,v:flux});
      this.onsets=this.onsets.filter(t=>time-t<5);
      if(this.onsets.length>=3){
        const intervals=[];for(let i=1;i<this.onsets.length;i++){const gap=this.onsets[i]-this.onsets[i-1];if(gap>=.23&&gap<2.5)intervals.push(gap);}
        intervals.sort((a,b)=>a-b);
        if(intervals.length){const median=intervals[Math.floor(intervals.length/2)];this.activity=Math.max(.08,Math.min(1,(1/median-.45)/3));}
      }
      if(time-this.lastOnset>1.8)this.activity*=.94;
    }
    const targetSpeed=rms<.004?0:this.activity;
    this.speed+=(targetSpeed-this.speed)*(1-Math.exp(-dt*1.3));
    return {energy:this.energy,speed:this.speed,pulse:this.pulse,ready:time-this.startedAt>2.5&&this.onsets.length>=3};
  }
  idle(dt){this.energy*=Math.exp(-dt*4);this.speed*=Math.exp(-dt*2);this.pulse*=Math.exp(-dt*8);return{energy:this.energy,speed:this.speed,pulse:this.pulse,ready:false};}
}
