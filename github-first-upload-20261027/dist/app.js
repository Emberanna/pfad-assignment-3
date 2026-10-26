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
function syncPlay(){playing=!media.paused&&!media.ended;$('playButton').setAttribute('aria-label',playing?'暂停音乐':'播放音乐');$('playIcon').innerHTML=playing?'<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>':'<path d="m9 5 11 7-11 7z"/>';status(playing?'音乐正在穿过庭院':media.ended?'播放结束 · 可以再次聆听':currentFile?'已暂停 · 庭院静候':'庭院已就绪');}
async function setupAudio(){
  if(!audioContext){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('当前浏览器不支持音频分析，请使用新版 Chrome、Edge 或 Safari。');audioContext=new Audio();analyser=audioContext.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.25;source=audioContext.createMediaElementSource(media);gainNode=audioContext.createGain();source.connect(analyser);gainNode.connect(audioContext.destination);gainNode.gain.value=Number($('volume').value);wave=new Float32Array(analyser.fftSize);spectrum=new Uint8Array(analyser.frequencyBinCount);
    try{await audioContext.audioWorklet.addModule('./rhythm-worklet.js');rhythmNode=new AudioWorkletNode(audioContext,'garden-rhythm');rhythmNode.port.onmessage=e=>rhythmData=e.data;analyser.connect(rhythmNode);rhythmNode.connect(gainNode);}catch{analyser.connect(gainNode);}
  }
  await audioContext.resume();
}
function resetAnalysis(){features.reset();noAudioSince=null;rhythmData=null;lastAudioTime=null;rhythmNode?.port.postMessage({type:'reset'});}
function choose(){fileInput.value='';fileInput.click();}
async function loadTrack(url,name,isDemo=false){
  const id=++loadId;media.pause();loading=true;playing=false;currentFile=name;resetAnalysis();
  if(objectURL&&objectURL!==url){URL.revokeObjectURL(objectURL);objectURL=null;}
  $('trackArea').hidden=false;$('dropzone').hidden=true;$('trackName').textContent=name;$('trackName').title=name;$('playButton').disabled=true;$('seek').disabled=true;$('restart').disabled=true;$('currentTime').textContent='00:00';$('duration').textContent='00:00';$('seek').value=0;message();status('正在读取音乐…');syncPlay();status('正在读取音乐…');
  media.src=url;media.load();
  try{
    await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>finish(new Error('读取时间较长，请重新选择文件或使用较短的 MP4 / MP3。')),20000);const ready=()=>finish(),failed=()=>finish(new Error('无法播放这个文件。请确认 MP4 含音轨，并尝试 AAC 音轨的 MP4、MP3 或 WAV。'));function finish(error){clearTimeout(timeout);media.removeEventListener('loadedmetadata',ready);media.removeEventListener('error',failed);error?reject(error):resolve();}media.addEventListener('loadedmetadata',ready,{once:true});media.addEventListener('error',failed,{once:true});});
    if(id!==loadId)return;
    if(!Number.isFinite(media.duration)||media.duration<=0)throw new Error('文件没有可播放的时长，请换一个音频或 MP4 文件。');
    loading=false;$('playButton').disabled=false;$('seek').disabled=false;$('restart').disabled=false;$('duration').textContent=format(media.duration);status('音乐已就绪 · 点击播放');
    if(isDemo)message('原创示例：由舒缓到轻快，再归于宁静。你也可以换成自己的音乐。');
  }catch(error){if(id!==loadId)return;loading=false;status('文件未能载入');message(error.message,true);}
}
async function loadFile(file){
  if(!file)return;
  if(!/\.(mp4|m4a|mp3|wav|ogg|webm|aac|flac)$/i.test(file.name)&&!file.type.startsWith('audio/')&&!/^video\/(mp4|webm)$/.test(file.type)){message('请选择 MP4、MP3、WAV、M4A 等音频或视频文件。',true);return;}
  const url=URL.createObjectURL(file);await loadTrack(url,file.name);if(media.src===url)objectURL=url;else URL.revokeObjectURL(url);
}
async function togglePlay(){
  if(loading||!currentFile)return;
  if(playing){media.pause();return;}
  $('playButton').disabled=true;
  try{await setupAudio();if(media.ended)media.currentTime=0;await media.play();if(!$('message').classList.contains('error'))message();}
  catch(error){message(error.name==='NotSupportedError'?'此文件的音频编码不受支持，请尝试 MP3 或 AAC 音轨的 MP4。':error.message||'播放未能开始，请再次点击播放。',true);}
  finally{$('playButton').disabled=false;syncPlay();}
}
$('chooseFile').addEventListener('click',choose);$('replaceFile').addEventListener('click',choose);fileInput.addEventListener('change',()=>loadFile(fileInput.files[0]));
$('playButton').addEventListener('click',togglePlay);
$('demoButton').addEventListener('click',async()=>{await loadTrack('./assets/garden-study.wav','庭院练习曲 · 原创声音示例',true);});
$('restart').addEventListener('click',()=>{media.currentTime=0;resetAnalysis();$('seek').value=0;$('currentTime').textContent='00:00';});
for(const event of ['play','pause','ended'])media.addEventListener(event,syncPlay);
media.addEventListener('waiting',()=>{if(playing)status('正在缓冲…');});
media.addEventListener('playing',()=>status('音乐正在穿过庭院'));
media.addEventListener('error',()=>{if(currentFile&&!loading){media.pause();status('播放中断');message('文件读取或解码失败，请重新选择音乐。',true);}});
media.addEventListener('seeking',resetAnalysis);
$('seek').addEventListener('input',()=>{if(Number.isFinite(media.duration)){media.currentTime=Number($('seek').value)/1000*media.duration;$('currentTime').textContent=format(media.currentTime);resetAnalysis();}});
$('volume').addEventListener('input',()=>{if(gainNode)gainNode.gain.value=Number($('volume').value);});
$('sensitivity').addEventListener('input',()=>{$('sensitivityValue').textContent=Number($('sensitivity').value).toFixed(1)+'×';});
$('motion').addEventListener('input',()=>{const m=Number($('motion').value);$('motionValue').textContent=m===0?'静止':m<.6?'轻微':m<1.3?'适中':'明显';});
$('settingsButton').addEventListener('click',()=>{$('settings').hidden=!$('settings').hidden;$('settingsButton').setAttribute('aria-expanded',String(!$('settings').hidden));});
$('closeSettings').addEventListener('click',()=>{$('settings').hidden=true;$('settingsButton').setAttribute('aria-expanded','false');$('settingsButton').focus();});
$('helpButton').addEventListener('click',()=>$('helpDialog').showModal());$('closeHelp').addEventListener('click',()=>$('helpDialog').close());$('helpDone').addEventListener('click',()=>$('helpDialog').close());
$('resetView').addEventListener('click',()=>garden?.reset());
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('experience').requestFullscreen)await $('experience').requestFullscreen();else message('当前浏览器不支持全屏，请使用浏览器的全屏功能。');}catch{message('全屏未能开启，仍可在当前页面体验。');}});
document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'退出全屏':'全屏观看');});
let dragDepth=0;
document.addEventListener('dragenter',e=>{if(e.dataTransfer?.types.includes('Files')){e.preventDefault();dragDepth++;$('dropOverlay').hidden=false;}});
document.addEventListener('dragover',e=>{if(e.dataTransfer?.types.includes('Files')){e.preventDefault();e.dataTransfer.dropEffect='copy';}});
document.addEventListener('dragleave',e=>{if(e.dataTransfer?.types.includes('Files')){dragDepth=Math.max(0,dragDepth-1);if(!dragDepth)$('dropOverlay').hidden=true;}});
document.addEventListener('drop',e=>{e.preventDefault();dragDepth=0;$('dropOverlay').hidden=true;if(e.dataTransfer?.files.length){loadFile(e.dataTransfer.files[0]);if(e.dataTransfer.files.length>1)message('已选择第一个文件。每次播放一段音乐。');}});
document.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement||e.target instanceof HTMLButtonElement||$('helpDialog').open)return;if(e.code==='Space'){e.preventDefault();togglePlay();}if(e.key.toLowerCase()==='r')garden?.reset();});
document.addEventListener('visibilitychange',()=>{lastFrame=performance.now();if(audioContext)resetAnalysis();});
try{garden=createGarden($('garden'));$('renderStatus').textContent=`${Math.round(garden.count/1000)}K PARTICLES · 3D LIVE`;}catch(error){console.error(error);$('renderError').hidden=false;$('renderStatus').textContent='WEBGL UNAVAILABLE';}
function frame(now){
  const dt=Math.min(.06,Math.max(.001,(now-lastFrame)/1000));lastFrame=now;
  if(playing&&analyser&&audioContext.state==='running'&&!media.seeking){
    analyser.getFloatTimeDomainData(wave);analyser.getByteFrequencyData(spectrum);
    const audioDt=lastAudioTime===null?dt:Math.min(.5,Math.max(.001,audioContext.currentTime-lastAudioTime));lastAudioTime=audioContext.currentTime;
    Object.assign(state,features.update(wave,spectrum,audioContext.currentTime,audioDt,Number($('sensitivity').value),rhythmData));
    if(state.energy<.012){noAudioSince??=audioContext.currentTime;if(audioContext.currentTime-noAudioSince>7)message('暂未检测到声音：可能是静音片段，或 MP4 没有可用音轨。可尝试更换文件。');}else{if(noAudioSince&&$('message').textContent.startsWith('暂未检测到声音'))message();noAudioSince=null;}
  }else Object.assign(state,features.idle(dt));
  garden?.render(dt,state,Number($('motion').value));
  if(now-lastUI>120){
    lastUI=now;$('energyMeter').style.transform=`scaleX(${state.energy.toFixed(3)})`;
    $('energyText').textContent=playing?(state.energy<.12?'轻':state.energy<.4?'中':'强'):'—';
    $('tempoText').textContent=!playing?'等待音乐':!state.ready?(state.energy<.015?'静谧':'感应中…'):state.speed<.28?'舒缓':state.speed<.6?'流动':'轻快';
    $('currentTime').textContent=format(media.currentTime);if(Number.isFinite(media.duration)&&!media.seeking)$('seek').value=Math.round(media.currentTime/media.duration*1000);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Read-only diagnostics for browser validation; no files, identities or audio leave the browser.
window.gardenDiagnostics=()=>({pointCount:garden?.count,camera:garden?.getCamera(),playing,loading,features:{...state},duration:media.duration,currentTime:media.currentTime,contextState:audioContext?.state,rhythmEngine:rhythmNode?'audio-worklet':'spectral-fallback'});
