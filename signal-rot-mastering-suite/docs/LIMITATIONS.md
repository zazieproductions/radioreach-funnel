# Limitations

- ADM is a channel-bed implementation, not object authoring or Dolby certification.
- Binaural HRTFs are parametric, fixed orientation, and not individualized measured HRIRs.
- Upmixed height and surround signals are synthetic.
- Loudness and true peak are standards-oriented but uncertified.
- Custom layouts above 64 channels are rejected; custom WAVE masks are zero and require the JSON map.
- No high-quality sample-rate converter is included; source rate is preserved.
- Character saturation oversampling is simple rather than a steep polyphase anti-alias filter.
- Worker cancellation terminates a job; progress is stage-level, not sample granular.
- No AIFF, head tracking, room correction, object automation, or platform-encoded Atmos output.
