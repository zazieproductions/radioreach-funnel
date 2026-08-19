# Architecture

```text
Audio import -> canonical stereo master -> destination renderer
                  |                       |-- stereo WAV
                  |                       |-- immersive bed -> extensible WAV
                  |                       |                  -> ADM BWF bed
                  |                       `-- speaker HRTFs -> binaural WAV
                  `-> BS.1770-style / sinc true-peak verification
```

The UI owns one immutable parameter state. Draft previews and final jobs run the same modules. Browser `Worker` jobs copy/transfer channels, report progress, are terminated for cancellation, and reject stale results. Stereo export uses the canonical mastering renderer. Immersive destinations consume its output when available.

Layers are technical mastering, stereo field, immersive routing, and opt-in character. Format construction is separate from rendering. Layout data—not UI conditionals—defines channel order and coordinates.
