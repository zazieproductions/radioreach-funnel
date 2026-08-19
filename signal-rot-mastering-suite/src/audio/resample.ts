import type { MultichannelBuffer } from "../immersive/renderer";
import type { QualityMode, StereoBuffer } from "../signal-rot/types";

const sinc=(x:number)=>Math.abs(x)<1e-12?1:Math.sin(Math.PI*x)/(Math.PI*x);
function resampleChannel(input:Float32Array,sourceRate:number,targetRate:number,taps:number){
 if(sourceRate===targetRate)return new Float32Array(input);
 const ratio=targetRate/sourceRate,length=Math.max(1,Math.round(input.length*ratio)),output=new Float32Array(length),half=taps/2,cutoff=Math.min(1,ratio)*.94;
 for(let n=0;n<length;n++){const position=n/ratio,center=Math.floor(position);let sum=0,norm=0;for(let k=-half+1;k<=half;k++){const index=center+k;if(index<0||index>=input.length)continue;const distance=position-index,window=.42+.5*Math.cos(Math.PI*distance/half)+.08*Math.cos(2*Math.PI*distance/half),coefficient=cutoff*sinc(distance*cutoff)*window;sum+=input[index]*coefficient;norm+=coefficient;}output[n]=sum/Math.max(1e-12,norm);}return output;
}
export function resampleStereo(input:StereoBuffer,targetRate:number,quality:QualityMode="high"):StereoBuffer{if(!Number.isInteger(targetRate)||targetRate<8000||targetRate>192000)throw new Error("Output sample rate must be between 8 and 192 kHz");const taps=quality==="draft"?24:quality==="high"?48:96;return {left:resampleChannel(input.left,input.sampleRate,targetRate,taps),right:resampleChannel(input.right,input.sampleRate,targetRate,taps),sampleRate:targetRate};}
export function resampleMultichannel(input:MultichannelBuffer,targetRate:number,quality:QualityMode="high"):MultichannelBuffer{const taps=quality==="draft"?24:quality==="high"?48:96;return {...input,channels:input.channels.map(channel=>resampleChannel(channel,input.sampleRate,targetRate,taps)),sampleRate:targetRate};}
