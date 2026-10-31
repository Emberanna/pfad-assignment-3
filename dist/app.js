import {createGarden} from './scene.js';
import {AudioFeatures} from './audio-features.js';
const $=id=>document.getElementById(id);
const media=$('media'),fileInput=$('fileInput'),features=new AudioFeatures();
let garden,audioContext,analyser,source,gainNode,wave,spectrum,objectURL,loadId=0,playing=false,loading=false,lastFrame=performance.now(),lastUI=0;
let currentFile=null,noAudioSince=null,rhythmNode=null,rhythmData=null,lastAudioTime=null;
const state={energy:0,speed:0,pulse:0,ready:false};
const format=s=>Number.isFinite(s)?`${Math.floor(s/60).toString().padStart(2,'0')}:${Math.floor(s%60).toString().padStart(2,'0')}`:'00:00';
function message(text='',error=false){$('message').textContent=text;$('message').classList.toggle('error',error);}
function status(text){$('status').textContent=text;$('statusDot').classList.toggle('playing',playing);}
function syncPlay(){playing=!media.paused&&!media.ended;$('playButton').setAttribute('aria-label',playing?'Pause music':'Play music');$('playIcon').innerHTML=playing?'<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>':'<path d="m9 5 11 7-11 7z"/>';status(playing?'Music is moving through the meadow':media.ended?'Track ended · Listen again':currentFile?'Paused · The meadow is waiting':'Meadow ready');}
async function setupAudio(){
  if(!audioContext){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Audio analysis is unavailable in this browser. Please use a current version of Chrome, Edge, or Safari.');audioContext=new Audio();analyser=audioContext.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.25;source=audioContext.createMediaElementSource(media);gainNode=audioContext.createGain();source.connect(analyser);gainNode.connect(audioContext.destination);gainNode.gain.value=Number($('volume').value);wave=new Float32Array(analyser.fftSize);spectrum=new Uint8Array(analyser.frequencyBinCount);
    try{await audioContext.audioWorklet.addModule('./rhythm-worklet.js');rhythmNode=new AudioWorkletNode(audioContext,'garden-rhythm');rhythmNode.port.onmessage=e=>rhythmData=e.data;analyser.connect(rhythmNode);rhythmNode.connect(gainNode);}catch{analyser.connect(gainNode);}
  }
  await audioContext.resume();
}
function resetAnalysis(){features.reset();noAudioSince=null;rhythmData=null;lastAudioTime=null;rhythmNode?.port.postMessage({type:'reset'});}
function choose(){fileInput.value='';fileInput.click();}
async function loadTrack(url,name,isDemo=false){
  const id=++loadId;media.pause();loading=true;playing=false;currentFile=name;resetAnalysis();
  if(objectURL&&objectURL!==url){URL.revokeObjectURL(objectURL);objectURL=null;}
  $('trackArea').hidden=false;$('dropzone').hidden=true;$('trackName').textContent=name;$('trackName').title=name;$('playButton').disabled=true;$('seek').disabled=true;$('restart').disabled=true;$('currentTime').textContent='00:00';$('duration').textContent='00:00';$('seek').value=0;message();status('Loading your track…');syncPlay();status('Loading your track…');
  media.src=url;media.load();
  try{
    await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>finish(new Error('Loading is taking too long. Choose the file again or try a shorter MP4 or MP3.')),20000);const ready=()=>finish(),failed=()=>finish(new Error('This file could not be played. Check that your MP4 contains audio, or try an AAC MP4, MP3, or WAV.'));function finish(error){clearTimeout(timeout);media.removeEventListener('loadedmetadata',ready);media.removeEventListener('error',failed);error?reject(error):resolve();}media.addEventListener('loadedmetadata',ready,{once:true});media.addEventListener('error',failed,{once:true});});
    if(id!==loadId)return;
    if(!Number.isFinite(media.duration)||media.duration<=0)throw new Error('This file has no playable duration. Please choose another audio file or MP4.');
    loading=false;$('playButton').disabled=false;$('seek').disabled=false;$('restart').disabled=false;$('duration').textContent=format(media.duration);status('Track ready · Press Play');
    if(isDemo)message('Original demo: from gentle to lively, ending softly. You can also choose your own music.');
  }catch(error){if(id!==loadId)return;loading=false;status('Could not load the file');message(error.message,true);}
}
async function loadFile(file){
  if(!file)return;
  if(!/\.(mp4|m4a|mp3|wav|ogg|webm|aac|flac)$/i.test(file.name)&&!file.type.startsWith('audio/')&&!/^video\/(mp4|webm)$/.test(file.type)){message('Please choose an MP4, MP3, WAV, M4A, or another supported media file.',true);return;}
  const url=URL.createObjectURL(file);await loadTrack(url,file.name);if(media.src===url)objectURL=url;else URL.revokeObjectURL(url);
}
async function togglePlay(){
  if(loading||!currentFile)return;
  if(playing){media.pause();return;}
  $('playButton').disabled=true;
  try{await setupAudio();if(media.ended)media.currentTime=0;await media.play();if(!$('message').classList.contains('error'))message();}
  catch(error){message(error.name==='NotSupportedError'?'This audio codec is not supported. Try an MP3 or an MP4 with AAC audio.':error.message||'Playback did not start. Please press Play again.',true);}
  finally{$('playButton').disabled=false;syncPlay();}
}
$('chooseFile').addEventListener('click',choose);$('replaceFile').addEventListener('click',choose);fileInput.addEventListener('change',()=>loadFile(fileInput.files[0]));
$('playButton').addEventListener('click',togglePlay);
$('demoButton').addEventListener('click',async()=>{await loadTrack('./assets/garden-study.wav','Meadow Study · Original audio demo',true);});
$('restart').addEventListener('click',()=>{media.currentTime=0;resetAnalysis();$('seek').value=0;$('currentTime').textContent='00:00';});
for(const event of ['play','pause','ended'])media.addEventListener(event,syncPlay);
media.addEventListener('waiting',()=>{if(playing)status('Buffering…');});
media.addEventListener('playing',()=>status('Music is moving through the meadow'));
media.addEventListener('error',()=>{if(currentFile&&!loading){media.pause();status('Playback interrupted');message('The file could not be read or decoded. Please choose another track.',true);}});
media.addEventListener('seeking',resetAnalysis);
$('seek').addEventListener('input',()=>{if(Number.isFinite(media.duration)){media.currentTime=Number($('seek').value)/1000*media.duration;$('currentTime').textContent=format(media.currentTime);resetAnalysis();}});
$('volume').addEventListener('input',()=>{if(gainNode)gainNode.gain.value=Number($('volume').value);});
$('sensitivity').addEventListener('input',()=>{$('sensitivityValue').textContent=Number($('sensitivity').value).toFixed(1)+'×';});
$('motion').addEventListener('input',()=>{const m=Number($('motion').value);$('motionValue').textContent=m===0?'Still':m<.6?'Subtle':m<1.3?'Balanced':'Stronger';});
$('settingsButton').addEventListener('click',()=>{$('settings').hidden=!$('settings').hidden;$('settingsButton').setAttribute('aria-expanded',String(!$('settings').hidden));});
$('closeSettings').addEventListener('click',()=>{$('settings').hidden=true;$('settingsButton').setAttribute('aria-expanded','false');$('settingsButton').focus();});
$('helpButton').addEventListener('click',()=>$('helpDialog').showModal());$('closeHelp').addEventListener('click',()=>$('helpDialog').close());$('helpDone').addEventListener('click',()=>$('helpDialog').close());
$('resetView').addEventListener('click',()=>garden?.reset());
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('experience').requestFullscreen)await $('experience').requestFullscreen();else message('Fullscreen is unavailable here. Try your browser fullscreen command.');}catch{message('Fullscreen could not start. You can continue in this window.');}});
document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Fullscreen');});
let dragDepth=0;
document.addEventListener('dragenter',e=>{if(e.dataTransfer?.types.includes('Files')){e.preventDefault();dragDepth++;$('dropOverlay').hidden=false;}});
document.addEventListener('dragover',e=>{if(e.dataTransfer?.types.includes('Files')){e.preventDefault();e.dataTransfer.dropEffect='copy';}});
document.addEventListener('dragleave',e=>{if(e.dataTransfer?.types.includes('Files')){dragDepth=Math.max(0,dragDepth-1);if(!dragDepth)$('dropOverlay').hidden=true;}});
document.addEventListener('drop',e=>{e.preventDefault();dragDepth=0;$('dropOverlay').hidden=true;if(e.dataTransfer?.files.length){loadFile(e.dataTransfer.files[0]);if(e.dataTransfer.files.length>1)message('The first file was selected. Play one track at a time.');}});
document.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement||e.target instanceof HTMLButtonElement||$('helpDialog').open)return;if(e.code==='Space'){e.preventDefault();togglePlay();}if(e.key.toLowerCase()==='r')garden?.reset();});
document.addEventListener('visibilitychange',()=>{lastFrame=performance.now();if(audioContext)resetAnalysis();});
try{garden=await createGarden($('garden'));$('renderStatus').textContent='PARTICLE MEADOW · 3D LIVE';}catch(error){console.error(error);$('renderError').hidden=false;$('renderStatus').textContent='WEBGL UNAVAILABLE';}
function frame(now){
  const dt=Math.min(.06,Math.max(.001,(now-lastFrame)/1000));lastFrame=now;
  if(playing&&analyser&&audioContext.state==='running'&&!media.seeking){
    analyser.getFloatTimeDomainData(wave);analyser.getByteFrequencyData(spectrum);
    const band=(lo,hi)=>{let sum=0,n=0;const hz=audioContext.sampleRate/analyser.fftSize;for(let i=Math.max(1,Math.ceil(lo/hz));i<Math.min(spectrum.length,Math.ceil(hi/hz));i++){sum+=spectrum[i]/255;n++;}return sum/Math.max(1,n);};
    for(const [key,lo,hi] of [['low',35,250],['mid',250,2200],['high',2200,12000]])state[key]=(state[key]||0)+(band(lo,hi)-(state[key]||0))*(1-Math.exp(-dt*7));
    const audioDt=lastAudioTime===null?dt:Math.min(.5,Math.max(.001,audioContext.currentTime-lastAudioTime));lastAudioTime=audioContext.currentTime;
    Object.assign(state,features.update(wave,spectrum,audioContext.currentTime,audioDt,Number($('sensitivity').value),rhythmData));
    if(state.energy<.012){noAudioSince??=audioContext.currentTime;if(audioContext.currentTime-noAudioSince>7)message('No sound detected: this may be a silent passage or an MP4 without a usable audio track. Try another file.');}else{if(noAudioSince&&$('message').textContent.startsWith('No sound detected'))message();noAudioSince=null;}
  }else {Object.assign(state,features.idle(dt));for(const key of ['low','mid','high'])state[key]=(state[key]||0)*Math.exp(-dt*4);}
  garden?.render(dt,state,Number($('motion').value));
  if(now-lastUI>120){
    lastUI=now;$('energyMeter').style.transform=`scaleX(${state.energy.toFixed(3)})`;
    $('energyText').textContent=playing?(state.energy<.12?'Soft':state.energy<.4?'Medium':'Strong'):'—';
    $('tempoText').textContent=!playing?'Waiting for music':!state.ready?(state.energy<.015?'Quiet':'Listening…'):state.speed<.28?'Gentle':state.speed<.6?'Flowing':'Lively';
    $('currentTime').textContent=format(media.currentTime);if(Number.isFinite(media.duration)&&!media.seeking)$('seek').value=Math.round(media.currentTime/media.duration*1000);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Read-only diagnostics for browser validation; no files, identities or audio leave the browser.
window.gardenDiagnostics=()=>({pointCount:garden?.count,sceneInfo:garden?.info?.(),camera:garden?.getCamera(),playing,loading,features:{...state},duration:media.duration,currentTime:media.currentTime,contextState:audioContext?.state,rhythmEngine:rhythmNode?'audio-worklet':'spectral-fallback'});
