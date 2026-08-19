# DSP signal flow

```text
Decode at source rate
  -> input trim
  -> DC blocker + subsonic/corrective EQ
  -> bounded stereo-linked resonance zones
  -> complementary FIR 3-band dynamics
  -> transient-integrity recovery
  -> low-safe frequency-dependent M/S image
  -> optional energy-normalized atmospheric field
  -> optional isolated character/media layer
  -> policy-aware normalization and pre-limiter headroom
  -> linked lookahead limiter
  -> output trim
  -> windowed-sinc true-peak verification
  -> optional windowed-sinc sample-rate conversion
  -> post-SRC loudness and true-peak verification
  -> destination encoder
```

Immersive destinations receive the canonical mastered stereo result, then perform layout-driven center, surround, rear, height, and LFE derivation before energy normalization and channel verification. Expensive paths run in a cancellable module worker.
