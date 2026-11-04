import {Color, SRGBColorSpace} from './assets/three.module.js';

// Reproject sampled pixels at estimated depths so the camera can reveal parallax.
export async function buildPhotoArbor(mobile) {
  const image = new Image();
  image.src = new URL('./assets/arbor-reference.png', import.meta.url).href;
  await image.decode();
  const aspect = image.naturalWidth / image.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = mobile ? 490 : 850;
  canvas.height = Math.round(canvas.width / aspect);
  const context = canvas.getContext('2d', {willReadFrequently:true});
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const {data} = context.getImageData(0, 0, canvas.width, canvas.height);
  const positions=[], colors=[], sizes=[], mobility=[], seeds=[], motionWeights=[];
  const color = new Color();
  const tangent = Math.tan(53 * Math.PI / 360);
  let seed = 921;
  const random = () => ((seed = (Math.imul(seed,1664525)+1013904223) >>> 0) / 4294967296);
  for(let row=0;row<canvas.height;row++) {
    for(let column=0;column<canvas.width;column++) {
      const i=(row*canvas.width+column)*4;
      const r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255;
      const u=(column+.15+random()*.7)/canvas.width;
      const v=(row+.15+random()*.7)/canvas.height;
      const foregroundTree=u>.67&&u<.87&&r+g+b<1.04;
      const flowers=v>.69&&b>g*1.08&&r>g*.94;
      const depth=(foregroundTree?12.5:18-5*v)+(random()-.5)*.18;
      positions.push((u-.5)*2*aspect*tangent*depth,1.72+(.5-v)*2*tangent*depth,6.3-depth);
      color.setRGB(r,g,b,SRGBColorSpace);
      colors.push(color.r,color.g,color.b);
      sizes.push(depth*2*tangent/canvas.height*(.96+random()*.35));
      mobility.push(flowers?0:1);
      motionWeights.push(foregroundTree?.025:1);
      seeds.push(random()*100);
    }
  }
  return {positions,colors,sizes,mobility,seeds,motionWeights,aspect,terrainHeight:()=>0};
}

