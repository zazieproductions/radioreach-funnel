# Meter regression vectors

`tests/conformance-vectors.ts` contains locked, official-style synthetic regression vectors for stereo 1 kHz loudness and phase-offset 997 Hz reconstructed peak. Tolerances are deliberately tight enough to detect coefficient or reconstruction drift.

These vectors follow the structure of BS.1770/EBU and true-peak conformance tests but are generated in-repository and are **not** the licensed or authoritative EBU/ITU conformance package. Passing them does not make the meter certified. Silence, short files, gating counts, momentary/short-term windows, and numerical stability have separate tests.

Measured HRIR data is not bundled in this pre-listening revision. The binaural engine remains accurately labeled as a fixed Brown–Duda-inspired parametric HRTF. A future measured dataset must include its original files, checksum, citation, license text, coordinate conversion, resampling method, and independent localization/level tests before appearing in the selector.
