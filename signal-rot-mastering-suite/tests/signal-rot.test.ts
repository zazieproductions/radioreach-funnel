import test from "node:test";
import assert from "node:assert/strict";
import { CLEAN_DEFAULTS, PRESETS } from "../src/signal-rot/presets";
import { diagnostics, loudnessMatch, renderMaster, truePeak } from "../src/signal-rot/engine";
import { splitThree } from "../src/signal-rot/math";
import type { StereoBuffer } from "../src/signal-rot/types";

const sr=48000;
function fixture(kind:string,n=12000):StereoBuffer {const l=new Float32Array(n),r=new Float32Array(n);let seed=12345;for(let i=0;i<n;i++){const t=i/sr;seed=(seed*1664525+1013904223)>>>0;const noise=seed/0xffffffff*2-1;switch(kind){case"drone":l[i]=.35*Math.sin(2*Math.PI*48*t)+.2*Math.sin(2*Math.PI*260*t);r[i]=.35*Math.sin(2*Math.PI*48*t+.02)+.2*Math.sin(2*Math.PI*270*t);break;case"metal":l[i]=r[i]=(i%997<3?.8:0)+.08*Math.sin(2*Math.PI*6800*t);break;case"ambient":l[i]=.12*Math.sin(2*Math.PI*220*t)+noise*.008;r[i]=.12*Math.sin(2*Math.PI*223*t)-noise*.006;break;case"mono-bass":l[i]=r[i]=.4*Math.sin(2*Math.PI*62*t);break;case"phase":l[i]=.2*Math.sin(2*Math.PI*800*t);r[i]=-.18*Math.sin(2*Math.PI*800*t);break;case"clipped":l[i]=r[i]=Math.max(-1,Math.min(1,1.4*Math.sin(2*Math.PI*120*t)));break;default:l[i]=r[i]=noise*.001;}}return {left:l,right:r,sampleRate:sr};}

test("complementary multiband crossover reconstructs flat/nulls",()=>{const x=fixture("ambient",4096).left;const [lo,mid,hi]=splitThree(x,sr,[140,4200],65);let error=0,signal=0;for(let i=0;i<x.length;i++){const e=x[i]-(lo[i]+mid[i]+hi[i]);error+=e*e;signal+=x[i]*x[i];}assert.ok(10*Math.log10(error/signal)<-120);});

test("clean default has no character or spatial effect",()=>{assert.equal(CLEAN_DEFAULTS.character.enabled,false);assert.equal(CLEAN_DEFAULTS.character.mix,0);assert.equal(CLEAN_DEFAULTS.spatial.enabled,false);assert.equal(CLEAN_DEFAULTS.limiter.mode,"transparent");});

test("primary presets obey parameter safety policy",()=>{for(const p of PRESETS.filter(x=>x.category!=="experimental")){assert.ok(p.targetLufs<=-14,`${p.name} loudness`);assert.ok(p.settings.width>=-.25&&p.settings.width<=.25);assert.ok(p.settings.spatial.atmosphere<=.35);assert.ok(p.settings.spatial.depth<=.3);assert.ok(p.settings.eq.every(b=>Math.abs(b.gainDb)<=1.5));assert.ok(p.settings.compressor.every(b=>b.ratio<=1.3&&b.maxReductionDb<=2));if(p.id!=="analog-womb")assert.equal(p.settings.character.enabled,false,p.name);}});

test("all presets carry engineering metadata and valid crossovers",()=>{for(const p of PRESETS){assert.ok(p.targetUse&&p.expectedInput&&p.tonalObjective&&p.spatialObjective);assert.ok(p.maximumLikelyLimiterReductionDb>0);assert.ok(p.settings.crossovers[0]>=80&&p.settings.crossovers[1]<sr/2);assert.ok(p.risks.length>=0);}});

test("fixtures render finite and ceiling-safe across primary bank",()=>{for(const kind of ["ambient","drone","metal","mono-bass","phase","clipped","quiet"]){for(const p of PRESETS.filter(x=>x.category!=="experimental")){const settings=structuredClone(p.settings);settings.quality="draft";const out=renderMaster(fixture(kind,2400),settings);assert.ok(out.left.every(Number.isFinite),`${kind}/${p.name} finite`);assert.ok(truePeak(out,2)<=10**(settings.limiter.ceilingDbtp/20)*1.001,`${kind}/${p.name} ceiling`);assert.ok(Math.abs(out.report.diagnostics.dcOffset[0])<.2);}}});

test("loudness matched bypass removes level advantage",()=>{const reference=fixture("ambient");const louder={...reference,left:Float32Array.from(reference.left,x=>x*1.8),right:Float32Array.from(reference.right,x=>x*1.8)};const match=loudnessMatch(reference,louder);assert.ok(Math.abs(diagnostics(match.buffer).rmsDbfs-diagnostics(reference).rmsDbfs)<.01);assert.ok(match.gainDb<0);});

test("diagnostics expose mono-safe bass and phase risk",()=>{assert.ok(diagnostics(fixture("mono-bass")).lowFrequencyStereoRatio<1e-8);assert.ok(diagnostics(fixture("phase")).correlation<-.9);});

test("gain audit includes explicit headroom and limiter stages",()=>{const result=renderMaster(fixture("metal"),structuredClone(CLEAN_DEFAULTS));const names=result.report.audit.map(x=>x.module);assert.ok(names.includes("input trim"));assert.ok(names.includes("normalization / headroom"));assert.ok(names.includes("true-peak limiter"));assert.ok(names.includes("output trim"));assert.ok(Number.isFinite(result.report.normalizationGainDb));});
