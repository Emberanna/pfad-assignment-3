import {writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
// Original procedural piano-like study. No borrowed composition or recording.
const rate=22050,duration=48,length=rate*duration,data=new Float32Array(length);
const motifs=[[57,64,69,72,76,72,69,64],[53,60,65,69,72,69,65,60],[55,62,67,71,74,71,67,62],[52,59,64,67,71,67,64,59]];
for(let section=0;section<3;section++){
  const gap=[.91,.58,.345][section],amplitude=[.13,.19,.29][section];
  for(let n=0,time=section*16+.08;time<(section+1)*16-.3;n++,time=section*16+.08+n*gap){
    const motif=motifs[Math.floor(n/8)%motifs.length],midi=motif[n%8],freq=440*2**((midi-69)/12),start=Math.floor(time*rate);
    const accent=n%4===0?1.13:.88;
    for(let j=0;j<Math.floor(rate*2.3)&&start+j<length;j++){
      const t=j/rate,attack=1-Math.exp(-t*340),decay=Math.exp(-t*3.3);
      const fundamental=Math.sin(2*Math.PI*freq*t),harmonics=.32*Math.sin(2*Math.PI*freq*2.002*t)*Math.exp(-t*1.4)+.12*Math.sin(2*Math.PI*freq*3*t)*Math.exp(-t*3.8);
      data[start+j]+=(fundamental+harmonics)*attack*decay*amplitude*accent;
      const delay=Math.floor(.173*rate);if(start+j+delay<length)data[start+j+delay]+=(fundamental+harmonics)*attack*decay*amplitude*.12;
    }
  }
}
const wav=Buffer.alloc(44+length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(length*2,40);
for(let i=0;i<length;i++){const fade=Math.min(1,i/(rate*.1),(length-i)/(rate*2.4));wav.writeInt16LE(Math.round(Math.tanh(data[i])*fade*32760),44+i*2);}
mkdirSync(fileURLToPath(new URL('../dist/assets/',import.meta.url)),{recursive:true});writeFileSync(fileURLToPath(new URL('../dist/assets/garden-study.wav',import.meta.url)),wav);console.log(`Original demo generated: ${duration}s, ${wav.length} bytes`);
