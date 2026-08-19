import type { EqBand, StereoBuffer } from "./types";
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const dbToGain = (db: number) => 10 ** (db / 20);
export const gainToDb = (gain: number) => 20 * Math.log10(Math.max(1e-12, gain));
export const cloneBuffer = (b: StereoBuffer): StereoBuffer => ({ left: new Float32Array(b.left), right: new Float32Array(b.right), sampleRate: b.sampleRate });
export const peak = (b: StereoBuffer) => { let p=0; for(let i=0;i<b.left.length;i++) p=Math.max(p,Math.abs(b.left[i]),Math.abs(b.right[i])); return p; };
export const rms = (b: StereoBuffer) => { let s=0; for(let i=0;i<b.left.length;i++) s += b.left[i]**2+b.right[i]**2; return Math.sqrt(s/(2*Math.max(1,b.left.length))); };
export const applyGain = (b: StereoBuffer, gain: number) => { for(let i=0;i<b.left.length;i++){ b.left[i]*=gain; b.right[i]*=gain; } };

interface Coeff { b0:number;b1:number;b2:number;a1:number;a2:number }
export function biquadCoefficients(band: EqBand, sampleRate: number): Coeff {
  const f=clamp(band.frequency, 5, sampleRate*0.475), q=clamp(band.q,0.15,12), A=10**(band.gainDb/40), w=2*Math.PI*f/sampleRate;
  const c=Math.cos(w), s=Math.sin(w), alpha=s/(2*q); let b0=1,b1=0,b2=0,a0=1,a1=0,a2=0;
  switch(band.type){
    case "highpass": b0=(1+c)/2;b1=-(1+c);b2=(1+c)/2;a0=1+alpha;a1=-2*c;a2=1-alpha;break;
    case "lowpass": b0=(1-c)/2;b1=1-c;b2=(1-c)/2;a0=1+alpha;a1=-2*c;a2=1-alpha;break;
    case "peaking": b0=1+alpha*A;b1=-2*c;b2=1-alpha*A;a0=1+alpha/A;a1=-2*c;a2=1-alpha/A;break;
    case "lowshelf": { const t=2*Math.sqrt(A)*alpha;b0=A*((A+1)-(A-1)*c+t);b1=2*A*((A-1)-(A+1)*c);b2=A*((A+1)-(A-1)*c-t);a0=(A+1)+(A-1)*c+t;a1=-2*((A-1)+(A+1)*c);a2=(A+1)+(A-1)*c-t;break; }
    case "highshelf": { const t=2*Math.sqrt(A)*alpha;b0=A*((A+1)+(A-1)*c+t);b1=-2*A*((A-1)+(A+1)*c);b2=A*((A+1)+(A-1)*c-t);a0=(A+1)-(A-1)*c+t;a1=2*((A-1)-(A+1)*c);a2=(A+1)-(A-1)*c-t;break; }
  }
  return {b0:b0/a0,b1:b1/a0,b2:b2/a0,a1:a1/a0,a2:a2/a0};
}
export function filterChannel(input: Float32Array, coeff: Coeff): Float32Array { const o=new Float32Array(input.length);let x1=0,x2=0,y1=0,y2=0;for(let i=0;i<input.length;i++){const x=input[i];const y=coeff.b0*x+coeff.b1*x1+coeff.b2*x2-coeff.a1*y1-coeff.a2*y2;o[i]=y;x2=x1;x1=x;y2=y1;y1=y;}return o; }
export function applyEq(b: StereoBuffer, bands: EqBand[]): StereoBuffer { let l:Float32Array=new Float32Array(b.left),r:Float32Array=new Float32Array(b.right);for(const band of bands)if(band.enabled){const c=biquadCoefficients(band,b.sampleRate);l=filterChannel(l,c);r=filterChannel(r,c);}return {left:l,right:r,sampleRate:b.sampleRate}; }

export function lowpassKernel(frequency:number,sampleRate:number,taps=129){ if(taps%2===0)taps++; const h=new Float64Array(taps),m=(taps-1)/2,fc=clamp(frequency/sampleRate,.0001,.475);let sum=0;for(let n=0;n<taps;n++){const x=n-m;const sinc=x===0?2*fc:Math.sin(2*Math.PI*fc*x)/(Math.PI*x);const win=.42-.5*Math.cos(2*Math.PI*n/(taps-1))+.08*Math.cos(4*Math.PI*n/(taps-1));h[n]=sinc*win;sum+=h[n];}for(let n=0;n<taps;n++)h[n]/=sum;return h; }
export function convolveSame(input:Float32Array,kernel:Float64Array){const o=new Float32Array(input.length),d=(kernel.length-1)>>1;for(let i=0;i<input.length;i++){let s=0;for(let k=0;k<kernel.length;k++){const j=i+k-d;if(j>=0&&j<input.length)s+=input[j]*kernel[k];}o[i]=s;}return o;}
/** Linear-phase complementary 3-way split. Interior samples null to floating-point precision when recombined. */
export function splitThree(input:Float32Array,sampleRate:number,crossovers:[number,number],taps:number){const lo=convolveSame(input,lowpassKernel(crossovers[0],sampleRate,taps));const hiLp=convolveSame(input,lowpassKernel(crossovers[1],sampleRate,taps));const mid=new Float32Array(input.length),hi=new Float32Array(input.length);for(let i=0;i<input.length;i++){mid[i]=hiLp[i]-lo[i];hi[i]=input[i]-hiLp[i];}return [lo,mid,hi] as const;}
