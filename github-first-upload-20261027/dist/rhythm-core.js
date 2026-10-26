// Onsets are timed on the audio clock, independently of graphics frame rate.
export class RhythmTracker {
  constructor(){this.reset();}
  reset(){this.previous=0;this.history=[];this.onsets=[];this.lastOnset=-10;this.activity=0;this.pulse=0;this.started=null;}
  push(rms,time){
    if(this.started===null)this.started=time;
    const novelty=Math.max(0,(rms-this.previous)/Math.max(.008,rms));this.previous=rms;
    const mean=this.history.reduce((a,b)=>a+b,0)/Math.max(1,this.history.length);
    const deviation=Math.sqrt(this.history.reduce((a,b)=>a+(b-mean)**2,0)/Math.max(1,this.history.length));
    const threshold=Math.max(.11,mean+deviation*.95);
    if(rms>.005&&novelty>threshold&&time-this.lastOnset>.24&&this.history.length>6){this.onsets.push(time);this.lastOnset=time;}
    this.history.push(novelty);if(this.history.length>130)this.history.shift();
    this.onsets=this.onsets.filter(t=>time-t<5);
    if(this.onsets.length>=3){const gaps=[];for(let i=1;i<this.onsets.length;i++){const gap=this.onsets[i]-this.onsets[i-1];if(gap>=.24&&gap<2.5)gaps.push(gap);}gaps.sort((a,b)=>a-b);if(gaps.length)this.activity=Math.max(.08,Math.min(1,(1/gaps[Math.floor(gaps.length/2)]-.45)/3));}
    if(time-this.lastOnset>1.8)this.activity*=.98;
    return {speed:rms>.003?this.activity:0,pulse:Math.exp(-(time-this.lastOnset)*8),ready:time-this.started>2&&this.onsets.length>=3};
  }
}
