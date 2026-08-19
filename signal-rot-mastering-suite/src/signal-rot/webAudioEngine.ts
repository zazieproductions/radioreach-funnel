import { renderMaster, loudnessMatch, compareRenders } from "./engine";
import type { MasteringSettings, RenderResult, StereoBuffer } from "./types";

export const QUALITY_SPEC = {
  draft: { crossoverTaps: 33, saturationOversampling: 1, truePeakOversampling: 2, use: "Fast interactive preview" },
  high: { crossoverTaps: 65, saturationOversampling: 2, truePeakOversampling: 4, use: "Default final export" },
  audiophile: { crossoverTaps: 129, saturationOversampling: 4, truePeakOversampling: 8, use: "Maximum-precision offline export" },
} as const;

/**
 * One render path feeds both audition and export. This deliberately avoids a
 * second, approximate Web Audio preview graph that could sound different.
 */
export class SignalRotEngine {
  constructor(private readonly context: BaseAudioContext) {}
  fromAudioBuffer(source: AudioBuffer): StereoBuffer {
    const left=new Float32Array(source.getChannelData(0));
    const right=source.numberOfChannels>1?new Float32Array(source.getChannelData(1)):new Float32Array(left);
    return {left,right,sampleRate:source.sampleRate};
  }
  toAudioBuffer(source:StereoBuffer):AudioBuffer {
    const output=this.context.createBuffer(2,source.left.length,source.sampleRate);
    output.copyToChannel(new Float32Array(source.left),0);output.copyToChannel(new Float32Array(source.right),1);return output;
  }
  process(source:AudioBuffer,settings:MasteringSettings):{audio:AudioBuffer;result:RenderResult}{
    const result=renderMaster(this.fromAudioBuffer(source),settings);
    return {audio:this.toAudioBuffer(result),result};
  }
  createMatchedBypass(source:AudioBuffer,processed:RenderResult):{audio:AudioBuffer;gainDb:number}{
    const match=loudnessMatch(processed,this.fromAudioBuffer(source));
    return {audio:this.toAudioBuffer(match.buffer),gainDb:match.gainDb};
  }
  /** Use drySettings with one module bypassed for level-matched per-module A/B. */
  compare(source:AudioBuffer,wetSettings:MasteringSettings,drySettings:MasteringSettings){
    const input=this.fromAudioBuffer(source),wet=renderMaster(input,wetSettings),dry=renderMaster(input,drySettings),report=compareRenders(dry,wet);
    return {wet:this.toAudioBuffer(wet),dry:this.toAudioBuffer(report.matchedBypass),report};
  }
}
