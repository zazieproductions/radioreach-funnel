# Loudness

The meter applies a sample-rate-designed high-frequency pre-filter and RLB high-pass, evaluates 400 ms blocks at 100 ms hops, removes blocks below -70 LUFS, then applies a relative gate 10 LU below the absolute-gated mean. Momentary uses 400 ms, short-term uses 3 s, and LRA uses the 10th/95th percentile of one-second-spaced short-term windows. LFE channels are excluded from multichannel loudness.

This is BS.1770/EBU-style behavior but has not been certified against an official conformance suite. Reports say “style” rather than “certified.”
