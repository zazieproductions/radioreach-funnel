# Product integration

Signal Rot is an isolated application package at `signal-rot-mastering-suite/` with no imports from the RadioReach storefront. Its mastering interface, canonical DSP, worker renderer, immersive layouts, encoders, tests, and documentation live inside this package.

## Canonical path

Import uses browser decoding with a deterministic PCM WAV parser fallback. Parameter changes debounce a Draft worker render of at most the first 90 seconds. Stale workers are terminated and identical previews are cached. Stereo, batch, immersive, binaural, and ADM exports process the complete source through the selected mastering preset and loudness policy before destination rendering.

Draft, High, and Audiophile share module order and parameter interpretation. They intentionally differ in FIR length, nonlinear oversampling, true-peak reconstruction, and sample-rate-conversion kernel length. The interface discloses this distinction.

## Implemented destinations

- Source-rate or explicitly resampled stereo PCM24 WAV
- 5.1, 7.1, 7.1.2, 7.1.4, and 9.1.6 WAVE_FORMAT_EXTENSIBLE
- Sonic Lab 20.4 and custom arrays with JSON channel maps
- Fixed parametric-HRTF binaural PCM24 WAV
- DirectSpeakers ADM BWF beds with `bext`, `axml`, and `chna`
- Calibration and sequential channel-identification renders

ADM is a channel-bed interchange format, not licensed Dolby Atmos object authoring. Parametric binaural is not an individualized measured HRIR or head-tracked renderer. These limits are shown in the UI and reports.

## Loudness truthfulness

Preserve Dynamics reserves 3 dB of pre-limiter headroom. Balanced reserves 1.5 dB and is the default. Reach Target and Custom permit more limiting and use a second BS.1770-style correction pass. Reports retain requested, predicted, safe, and achieved values and mark safety intervention.
