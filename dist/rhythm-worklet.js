import {RhythmTracker} from './rhythm-core.js';
class GardenRhythm extends AudioWorkletProcessor {
  constructor(){super();this.tracker=new RhythmTracker();this.sum=0;this.count=0;this.windows=0;this.port.onmessage=()=>{this.tracker.reset();this.sum=0;this.count=0;};}
  process(inputs,outputs){
    const input=inputs[0],output=outputs[0];
    for(let c=0;c<output.length;c++){if(input[c])output[c].set(input[c]);else if(input[0])output[c].set(input[0]);else output[c].fill(0);}
    if(input[0])for(let i=0;i<input[0].length;i++){
      let mono=0;for(let c=0;c<input.length;c++)mono+=input[c][i];mono/=input.length;
      this.sum+=mono*mono;this.count++;
      if(this.count>=512){const rms=Math.sqrt(this.sum/this.count);const result=this.tracker.push(rms,(currentFrame+i)/sampleRate);this.sum=0;this.count=0;if(++this.windows%3===0)this.port.postMessage(result);}
    }
    return true;
  }
}
registerProcessor('garden-rhythm',GardenRhythm);
