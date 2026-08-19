import test from "node:test";
import assert from "node:assert/strict";
import { generatedFixture,encodeWav,decodeWav } from "../src/audio/wav";
import { PRESETS } from "../src/signal-rot/presets";
import { finalizePcm24Report,processProduct,resampleProduct,settingsForPolicy,validatePreset } from "../src/audio/render";
import { LAYOUTS,validateLayout } from "../src/immersive/layouts";
import { calibrationTone,identificationRender,immersiveSettings,polarityIdentificationRender,renderImmersive } from "../src/immersive/renderer";
import { encodeMultichannelWav,validateMultichannelWav } from "../src/formats/multichannelWav";
import { encodeAdmBwf,validateAdmBwf } from "../src/formats/admBwf";
import { renderBinaural } from "../src/binaural/hrtf";
import { createListeningManifest } from "../src/audio/listeningManifest";

test("generated fixture exports and re-opens every required destination",()=>{
 const imported=decodeWav(encodeWav(generatedFixture(.08,24000),24)),preset=validatePreset(JSON.parse(JSON.stringify(PRESETS[0]))),product=processProduct(imported,preset,settingsForPolicy(preset.settings,"preserve"),"preserve"),stereoWav=encodeWav(product.result,24),stereo=decodeWav(stereoWav),stereoReport=finalizePcm24Report(stereoWav,product.report);
 assert.equal(stereo.left.length,product.result.left.length);assert.equal(stereoReport.output.format,"PCM24 WAV");assert.equal(JSON.parse(JSON.stringify(stereoReport)).engineVersion,stereoReport.engineVersion);
 const resampled=resampleProduct(product,48000),resampledWav=encodeWav(resampled.result,24),resampledDecoded=decodeWav(resampledWav);assert.equal(resampledDecoded.sampleRate,48000);assert.ok(resampledDecoded.left.every(Number.isFinite));
 for(const id of ["5.1","7.1.4","sonic-lab-20.4"]){const layout=validateLayout(LAYOUTS.find(l=>l.id===id)!),rendered=renderImmersive(stereo,layout,immersiveSettings(id==="sonic-lab-20.4"?"sonic-native":"natural-bed")),file=encodeMultichannelWav(rendered.buffer,"pcm24"),validation=validateMultichannelWav(file);assert.equal(validation.valid,true,`${id}: ${validation.errors}`);assert.equal(validation.channels,layout.channelCount);assert.equal(validation.sampleRate,stereo.sampleRate);assert.ok(rendered.buffer.channels.every(channel=>channel.length===rendered.buffer.channels[0].length&&channel.every(Number.isFinite)));assert.ok(Math.max(...rendered.report.channelPeaks)<=10**(-1/20)*1.001);}
 const layout=LAYOUTS.find(item=>item.id==="7.1.4")!,bed=renderImmersive(stereo,layout,immersiveSettings()).buffer,binaural=renderBinaural(bed).buffer,binauralWav=encodeWav(binaural,24);assert.equal(decodeWav(binauralWav).left.length,binaural.left.length);
 const adm=validateAdmBwf(encodeAdmBwf(bed));assert.equal(adm.valid,true,adm.errors.join(","));
 for(const utility of [calibrationTone(layout,8000,1),identificationRender(layout,8000,.05,.01),polarityIdentificationRender(layout,0,8000,.05,.01)]){const validation=validateMultichannelWav(encodeMultichannelWav(utility,"pcm24"));assert.equal(validation.valid,true,validation.errors.join(","));assert.equal(validation.channels,layout.channelCount);}
 const manifest=createListeningManifest("fixture.wav",stereoReport.engineVersion,[{anonymousLabel:"A",masteringPreset:preset.name,presetVersion:preset.version,presetChecksum:preset.parameterChecksum,spatialPreset:"Stereo field",quality:"high",loudnessPolicy:"preserve",measuredLoudness:stereoReport.achievedLufs,measuredTruePeak:stereoReport.measuredTruePeakDbtp,renderFile:"signal-rot-A.wav",notes:"",ratings:{overallPreference:0}}],false);const reopened=JSON.parse(JSON.stringify(manifest));assert.equal(reopened.comparisons[0].masteringPreset,"HIDDEN");assert.equal(reopened.comparisons[0].renderFile,"signal-rot-A.wav");
});
