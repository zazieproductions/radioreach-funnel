# 20.7 pre-listening revision changelog

Baseline: commit `51ea244`, engine `20.6.0`, preserved in `baselines/pre-listening-20.6.json`.
Listening freeze: engine `20.7.0-pre-listening`, bank `1.0-listening`, preserved in `baselines/listening-bank-20.7.json`.

## Audible changes after the preserved baseline

No primary mastering or spatial preset was revoiced from fixture scores.

| Area | Old | New | Objective reason | Expected audible effect | Evidence |
|---|---|---|---|---|---|
| Immersive peak safety | Warning only above 0 dBFS | Fully linked attenuation to -1 dBFS only when routing exceeds the ceiling | Prevent clipped multichannel exports while preserving inter-channel relationships | Only over-range immersive renders become uniformly quieter; no independent pumping | Post-routing peak, ratio, channel, and format tests |
| Monitor loudness matching | Requested RMS match could exceed monitor headroom | Match gain is peak-capped at -0.18 dBFS and marked approximate when capped | Prevent A/B monitor clipping and loudness bias | Only monitor playback/comparison files can become quieter than an impossible requested match; normal exports are unchanged | Peak-limited match regression test |
| Listening comparison files | Not available | Comparison candidates are normalized to the quietest candidate, then peak-safe matched | Make blind switching less level-biased | Listening-Lab files may be attenuated for comparison; mastering exports are unchanged | Blind-manifest and match tests |

## Preset changes

- Primary mastering presets changed: **none**.
- Primary spatial routing presets changed: **none**.
- Experimental preset voicing changed: **none**.
- All presets received non-audible `1.0-listening` version and stable parameter-checksum metadata.
- The exact baseline and listening target are machine-tested against the checked-in JSON snapshots.

## Non-audible changes

- Complete pre-revision and listening-freeze artifacts with fixture metrics
- Official-style locked loudness/true-peak regression vectors and correct silence handling
- Formal preview/export capability registry and parity tests
- Content-identity preview cache key and bounded 12-render cache
- Worker cancellation and foreign/stale-response tests
- Character-state isolation tests for every experimental-to-clean transition
- Render reports finalized against decoded PCM24 output
- Expanded immersive routing-energy summaries and report fields
- Preset/spatial-preset serialization validation, versions, and checksums
- Blind Listening Lab, notes, human ratings, unblinding, and manifest export
- Deterministic filenames, accessibility focus styles, responsive tables, and long-render warning
- Playwright browser scenarios added; browser binary installation is environment-dependent
