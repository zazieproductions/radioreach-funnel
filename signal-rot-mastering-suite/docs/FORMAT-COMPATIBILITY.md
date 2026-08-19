# Format compatibility

| Format | Implementation | Qualification |
|---|---|---|
| Stereo WAV | PCM24 RIFF | Internally round-tripped |
| Multichannel WAV | WAVE_FORMAT_EXTENSIBLE PCM24/float32 | Internal header/frame validation |
| Standard masks | 5.1 and 7.1 masks | Layout order documented |
| Custom/Sonic WAV | Extensible mask 0 + JSON sidecar | Player routing must follow sidecar |
| ADM BWF | DirectSpeakers bed, PCM24, bext/axml/chna | Internal structural validation only |
| Binaural WAV | Stereo PCM24, fixed parametric HRTF | Headphone monitor/export, not head tracked |

Always audition channel order in the target playback system using the generated identification sequence before presentation.
