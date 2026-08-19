import { diagnostics, renderMaster } from "../signal-rot/engine";
import { measureLoudness, type LoudnessReport } from "../loudness/bs1770";
import { analyzeTruePeak } from "../loudness/truePeak";
import { resampleStereo } from "./resample";
import { decodeWav } from "./wav";
import { parameterChecksum } from "../signal-rot/presets";
import type { Diagnostics, MasteringSettings, Preset, RenderResult, StereoBuffer } from "../signal-rot/types";

export const ENGINE_VERSION = "20.7.0-pre-listening";
export type LoudnessPolicy = "preserve" | "balanced" | "reach" | "custom";

export interface ProductReport {
  engineVersion: string;
  masteringPreset: string;
  masteringPresetVersion: string;
  masteringPresetChecksum: string;
  preset: string;
  spatialPreset: string | null;
  quality: MasteringSettings["quality"];
  loudnessPolicy: LoudnessPolicy;
  policy: LoudnessPolicy;
  source: { sampleRate: number; channels: number; frames: number; durationSeconds: number };
  output: { sampleRate: number; channels: number; frames: number; durationSeconds: number; format: "stereo-float-render"|"PCM24 WAV"; bitDepth: 24|32 };
  layout: { id: "stereo"; name: "Stereo"; channelCount: 2 };
  parameters: MasteringSettings;
  analysisBefore: { diagnostics: Diagnostics; loudness: LoudnessReport };
  analysisAfter: { diagnostics: Diagnostics; loudness: LoudnessReport };
  sourceSampleRate: number;
  outputSampleRate: number;
  requestedLufs: number;
  predictedResultLufs: number;
  safeMasteringResultLufs: number;
  achievedLufs: number;
  momentaryLufs: number;
  shortTermLufs: number;
  loudnessRange: number;
  inputLufs: number;
  requiredNormalizationGainDb: number;
  normalizationGainDb: number;
  predictedLimiterReductionDb: number;
  actualLimiterReductionDb: number;
  requestedCeilingDbtp: number;
  measuredTruePeakDbtp: number;
  inputTruePeak: number;
  outputTruePeak: number;
  crestFactorBefore: number;
  crestFactorAfter: number;
  inputCrestFactorDb: number;
  outputCrestFactorDb: number;
  correlation: number;
  channelPeaks: number[];
  safetyPolicyIntervened: boolean;
  safetyPolicyAlteredRequest: boolean;
  warnings: string[];
  textureSeed: number;
  timestamp: string;
  audit: RenderResult["report"]["audit"];
}

export function settingsForPolicy(base: MasteringSettings, policy: LoudnessPolicy, customTarget?: number) {
  const settings = structuredClone(base);
  if (policy === "preserve") {
    settings.autoHeadroom = true;
    settings.preLimiterHeadroomDb = 3;
  }
  if (policy === "balanced") {
    settings.autoHeadroom = true;
    settings.preLimiterHeadroomDb = 1.5;
    settings.limiter.maxRecommendedReductionDb = Math.max(3, settings.limiter.maxRecommendedReductionDb);
  }
  if (policy === "reach") {
    settings.autoHeadroom = false;
    settings.preLimiterHeadroomDb = 0;
  }
  if (policy === "custom") {
    settings.targetLufs = Math.max(-24, Math.min(-8, customTarget ?? settings.targetLufs));
    settings.autoHeadroom = false;
    settings.preLimiterHeadroomDb = 0;
  }
  return settings;
}

export function processProduct(input: StereoBuffer, preset: Preset, settings: MasteringSettings, policy: LoudnessPolicy): { result: RenderResult; report: ProductReport } {
  const inputDiagnostics = diagnostics(input);
  const inputLoudness = measureLoudness(input);
  let result = renderMaster(input, settings);
  let outputLoudness = measureLoudness(result);

  // Reach/Custom make a second standards-oriented correction. Preserve and
  // Balanced never trade their configured headroom merely to close the meter.
  if (!settings.autoHeadroom && Number.isFinite(outputLoudness.integrated) && Math.abs(outputLoudness.integrated - settings.targetLufs) > 0.15) {
    const corrected = structuredClone(settings);
    corrected.targetLufs += settings.targetLufs - outputLoudness.integrated;
    result = renderMaster(input, corrected);
    outputLoudness = measureLoudness(result);
  }

  const outputDiagnostics = result.report.diagnostics;
  const normalizationAudit = result.report.audit.find(stage => stage.module === "normalization / headroom");
  const preNormalizationLufs = outputLoudness.integrated - result.report.normalizationGainDb;
  const requiredGain = settings.targetLufs - preNormalizationLufs;
  const predictedReduction = Math.max(0, (normalizationAudit?.inputPeakDb ?? inputDiagnostics.peakDbfs) + requiredGain - settings.limiter.ceilingDbtp);
  const safetyIntervened = Math.abs(outputLoudness.integrated - settings.targetLufs) > 1 && settings.autoHeadroom;
  const peakReport = analyzeTruePeak(result, settings.quality === "audiophile" ? 8 : settings.quality === "high" ? 4 : 2, settings.quality === "audiophile" ? 24 : 16);
  const warnings = [...result.report.warnings];
  if (safetyIntervened) warnings.push(`The ${policy} policy delivered ${outputLoudness.integrated.toFixed(1)} LUFS instead of forcing ${settings.targetLufs.toFixed(1)} LUFS.`);
  if (result.report.limiterMaxReductionDb > 4) warnings.push("Limiter reduction exceeds 4 dB; compare against Preserve Dynamics before delivery.");

  const report: ProductReport = {
    engineVersion: ENGINE_VERSION,
    masteringPreset: preset.name,
    masteringPresetVersion: preset.version,
    masteringPresetChecksum: preset.parameterChecksum,
    preset: preset.name,
    spatialPreset: null,
    quality: settings.quality,
    loudnessPolicy: policy,
    policy,
    source: { sampleRate: input.sampleRate, channels: 2, frames: input.left.length, durationSeconds: input.left.length / input.sampleRate },
    output: { sampleRate: result.sampleRate, channels: 2, frames: result.left.length, durationSeconds: result.left.length/result.sampleRate, format: "stereo-float-render", bitDepth:32 },
    layout: { id: "stereo", name: "Stereo", channelCount: 2 },
    parameters: structuredClone(settings),
    analysisBefore: { diagnostics: inputDiagnostics, loudness: inputLoudness },
    analysisAfter: { diagnostics: outputDiagnostics, loudness: outputLoudness },
    sourceSampleRate: input.sampleRate,
    outputSampleRate: result.sampleRate,
    requestedLufs: settings.targetLufs,
    predictedResultLufs: settings.autoHeadroom ? Math.min(settings.targetLufs, preNormalizationLufs + result.report.normalizationGainDb) : settings.targetLufs,
    safeMasteringResultLufs: outputLoudness.integrated,
    achievedLufs: outputLoudness.integrated,
    momentaryLufs: outputLoudness.momentary,
    shortTermLufs: outputLoudness.shortTerm,
    loudnessRange: outputLoudness.lra,
    inputLufs: inputLoudness.integrated,
    requiredNormalizationGainDb: requiredGain,
    normalizationGainDb: result.report.normalizationGainDb,
    predictedLimiterReductionDb: predictedReduction,
    actualLimiterReductionDb: result.report.limiterMaxReductionDb,
    requestedCeilingDbtp: settings.limiter.ceilingDbtp,
    measuredTruePeakDbtp: peakReport.dbtp,
    inputTruePeak: inputDiagnostics.truePeakDbtp,
    outputTruePeak: peakReport.dbtp,
    crestFactorBefore: inputDiagnostics.crestFactorDb,
    crestFactorAfter: outputDiagnostics.crestFactorDb,
    inputCrestFactorDb: inputDiagnostics.crestFactorDb,
    outputCrestFactorDb: outputDiagnostics.crestFactorDb,
    correlation: outputDiagnostics.correlation,
    channelPeaks: peakReport.perChannelDbtp,
    safetyPolicyIntervened: safetyIntervened,
    safetyPolicyAlteredRequest: safetyIntervened,
    warnings: [...new Set(warnings)],
    textureSeed: 0x51a7,
    timestamp: new Date().toISOString(),
    audit: result.report.audit,
  };
  return { result, report };
}

export function resampleProduct(value: { result: RenderResult; report: ProductReport }, targetRate: number) {
  if (targetRate === value.result.sampleRate) return value;
  const converted = resampleStereo(value.result, targetRate, value.report.quality);
  const result: RenderResult = { ...converted, report: value.result.report };
  const outputDiagnostics = diagnostics(converted);
  const outputLoudness = measureLoudness(converted);
  const peak = analyzeTruePeak(converted, value.report.quality === "audiophile" ? 8 : 4, value.report.quality === "audiophile" ? 24 : 16);
  const report: ProductReport = structuredClone(value.report);
  report.outputSampleRate = targetRate;
  report.output = { ...report.output, sampleRate: targetRate, frames: converted.left.length, durationSeconds:converted.left.length/targetRate };
  report.analysisAfter = { diagnostics: outputDiagnostics, loudness: outputLoudness };
  report.achievedLufs = outputLoudness.integrated;
  report.momentaryLufs = outputLoudness.momentary;
  report.shortTermLufs = outputLoudness.shortTerm;
  report.loudnessRange = outputLoudness.lra;
  report.outputTruePeak = peak.dbtp;
  report.measuredTruePeakDbtp = peak.dbtp;
  report.channelPeaks = peak.perChannelDbtp;
  report.outputCrestFactorDb = outputDiagnostics.crestFactorDb;
  report.crestFactorAfter = outputDiagnostics.crestFactorDb;
  report.correlation = outputDiagnostics.correlation;
  if (peak.dbtp > report.requestedCeilingDbtp + 0.05) report.warnings.push("Post-resampling true peak exceeds the requested ceiling; lower output trim before delivery.");
  report.warnings.push(`Sample-rate conversion ${value.result.sampleRate} → ${targetRate} Hz used a ${value.report.quality} windowed-sinc kernel; no new detail is implied.`);
  return { result, report };
}

export function finalizePcm24Report(wav:ArrayBuffer,sourceReport:ProductReport){
  const decoded=decodeWav(wav),measuredDiagnostics=diagnostics(decoded),measuredLoudness=measureLoudness(decoded),peak=analyzeTruePeak(decoded,sourceReport.quality==="audiophile"?8:4,sourceReport.quality==="audiophile"?24:16),report=structuredClone(sourceReport);
  report.output={sampleRate:decoded.sampleRate,channels:2,frames:decoded.left.length,durationSeconds:decoded.left.length/decoded.sampleRate,format:"PCM24 WAV",bitDepth:24};
  report.outputSampleRate=decoded.sampleRate;report.analysisAfter={diagnostics:measuredDiagnostics,loudness:measuredLoudness};report.achievedLufs=measuredLoudness.integrated;report.momentaryLufs=measuredLoudness.momentary;report.shortTermLufs=measuredLoudness.shortTerm;report.loudnessRange=measuredLoudness.lra;report.measuredTruePeakDbtp=peak.dbtp;report.outputTruePeak=peak.dbtp;report.channelPeaks=peak.perChannelDbtp;report.crestFactorAfter=measuredDiagnostics.crestFactorDb;report.outputCrestFactorDb=measuredDiagnostics.crestFactorDb;report.correlation=measuredDiagnostics.correlation;
  return report;
}

export function validatePreset(value: unknown): Preset {
  if (!value || typeof value !== "object") throw new Error("Preset must be an object");
  const preset = value as Partial<Preset>;
  if (typeof preset.id !== "string" || typeof preset.name !== "string" || !preset.settings) throw new Error("Preset is missing identity or settings");
  const settings = preset.settings;
  if (!Array.isArray(settings.eq) || settings.eq.length > 16 || !Array.isArray(settings.compressor) || settings.compressor.length !== 3) throw new Error("Preset DSP structure is invalid");
  if (!Number.isFinite(settings.targetLufs) || settings.targetLufs >= -7 || settings.targetLufs <= -25) throw new Error("Preset loudness target is unsafe");
  if (!Number.isFinite(settings.preLimiterHeadroomDb) || settings.preLimiterHeadroomDb < 0 || settings.preLimiterHeadroomDb > 12) throw new Error("Preset headroom policy is invalid");
  if (settings.character?.mix < 0 || settings.character?.mix > 1) throw new Error("Preset character mix is unsafe");
  if (settings.spatial) {
    settings.spatial.edgeSoftness ??= 0.55;
    settings.spatial.frontBack ??= 0.5;
    settings.spatial.sideDensity ??= 0.5;
    settings.spatial.motion ??= 0;
  }
  if (settings.character) {
    settings.character.wow ??= 0;
    settings.character.flutter ??= 0;
    settings.character.crackle ??= 0;
    settings.character.rumble ??= 0;
  }
  preset.version ??= "imported-unversioned";
  preset.parameterChecksum = parameterChecksum(settings);
  return preset as Preset;
}
