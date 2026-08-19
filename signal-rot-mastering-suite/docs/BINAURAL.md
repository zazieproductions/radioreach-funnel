# Binaural rendering

Each virtual speaker is convolved with a Brown–Duda-inspired rigid-sphere parametric HRTF: azimuth-dependent ITD, ILD/head shadow, and elevation-dependent pinna FIR reflections. LFE is folded equally and the result is peak/energy normalized to no more than -3 dBFS.

This is a real per-speaker HRTF convolution fallback, not crossfeed. It is not measured-subject HRIR data, individualized, room compensated, or head tracked. Listen at a conservative headphone level.
