export type QualityMode = "draft" | "high" | "audiophile";
export type LimiterMode = "transparent" | "balanced" | "loud" | "experimental";
export type PresetCategory = "audiophile" | "cinematic" | "spatial" | "experimental";
export type DiagnosticAudition = "stereo" | "mono" | "left" | "right" | "mid" | "side" | "polarity";

export interface StereoBuffer { left: Float32Array; right: Float32Array; sampleRate: number }
export interface EqBand { type: "highpass" | "lowpass" | "lowshelf" | "highshelf" | "peaking"; frequency: number; gainDb: number; q: number; enabled: boolean }
export interface CompressorBand { thresholdDb: number; ratio: number; attackMs: number; releaseMs: number; kneeDb: number; makeupDb: number; mix: number; maxReductionDb: number; bypass: boolean }
export interface ResonanceZone { frequency: number; q: number; thresholdDb: number; maxReductionDb: number; attackMs: number; releaseMs: number; target: "stereo" | "mid" | "side" }
export interface SpatialSettings { enabled: boolean; focus: number; atmosphere: number; depth: number; diffusion: number; scale: number; airField: number; centerAnchor: number; lowMonoHz: number; edgeSoftness: number; frontBack: number; sideDensity: number; motion: number }
export interface CharacterSettings { enabled: boolean; mode: "clean-density" | "transformer" | "tape" | "tube" | "broken-media"; driveDb: number; mix: number; outputDb: number; noiseDb: number; wow: number; flutter: number; crackle: number; rumble: number }
export interface MasteringSettings {
  inputTrimDb: number; outputTrimDb: number; autoHeadroom: boolean; preLimiterHeadroomDb: number; targetLufs: number; quality: QualityMode;
  eq: EqBand[]; resonance: ResonanceZone[]; crossovers: [number, number]; compressor: [CompressorBand, CompressorBand, CompressorBand];
  transientIntegrity: number; width: number; spatial: SpatialSettings; character: CharacterSettings;
  limiter: { enabled: boolean; mode: LimiterMode; ceilingDbtp: number; lookaheadMs: number; releaseMs: number; maxRecommendedReductionDb: number };
}
export interface Preset {
  id: string; name: string; version: string; parameterChecksum: string; category: PresetCategory; targetUse: string; expectedInput: string; tonalObjective: string; spatialObjective: string;
  targetLufs: number; maximumLikelyLimiterReductionDb: number; bypassedModules: string[]; risks: string[]; settings: MasteringSettings;
}
export interface StageAudit { module: string; inputPeakDb: number; outputPeakDb: number; deltaRmsDb: number }
export interface Diagnostics { peakDbfs: number; truePeakDbtp: number; rmsDbfs: number; estimatedLufs: number; crestFactorDb: number; correlation: number; dcOffset: [number, number]; clippingCount: number; truePeakOvers: number; lowFrequencyStereoRatio: number; sideEnergyDb: number }
export interface RenderReport { audit: StageAudit[]; diagnostics: Diagnostics; normalizationGainDb: number; preLimiterPeakDb: number; limiterMaxReductionDb: number; limiterAverageReductionDb: number; warnings: string[]; latencySamples: number }
export interface RenderResult extends StereoBuffer { report: RenderReport }
export interface ComparisonReport { matchedBypass: StereoBuffer; matchGainDb: number; loudnessDeltaDb: number; tonalDeltaDb: [number, number, number]; approximate: boolean; peakLimited: boolean }
