export const LOUDNESS_VECTORS=[
 {id:"stereo-1khz-minus23",sampleRate:48000,seconds:10,frequency:1000,amplitudeDbfs:-23,expectedIntegratedLufs:-23.253,toleranceLu:.08},
 {id:"stereo-1khz-minus20",sampleRate:48000,seconds:10,frequency:1000,amplitudeDbfs:-20,expectedIntegratedLufs:-20.253,toleranceLu:.08},
] as const;
export const TRUE_PEAK_VECTORS=[
 {id:"phase-offset-997hz-minus1",sampleRate:48000,seconds:.1,frequency:997,phaseSamples:.37,amplitudeDbfs:-1,expectedDbtp:-1,toleranceDb:.03},
] as const;
