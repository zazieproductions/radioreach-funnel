# Signal Rot Mastering Suite 20.5

Signal Rot is a browser-based artist-engineer laboratory for transparent stereo mastering, atmospheric stereo fields, channel-bed upmixing, installation routing, binaural monitoring, and experimental sound work.

## Destinations

- Stereo source-rate PCM24 WAV
- 5.1, 7.1, 7.1.2, 7.1.4, and 9.1.6 WAVE_FORMAT_EXTENSIBLE
- Sonic Lab 20.4 and validated custom layouts with JSON maps
- Fixed parametric-HRTF binaural WAV
- DirectSpeakers ADM BWF bed with structural validation
- Channel-identification and calibration renders

```bash
npm install
npm run dev
npm run lint
npm test
npm run test:dsp
npm run test:immersive
npm run test:e2e
npm run test:browser  # requires Playwright Chromium
npm run build
```

The `20.7.0-pre-listening` engine and `1.0-listening` preset banks are frozen for subjective evaluation. Exact pre-revision and listening targets, fixture metrics, versions, and checksums are stored in `baselines/`; audible changes are enumerated in `docs/PRE-LISTENING-CHANGELOG.md`.

The main-thread UI delegates full rendering, sample-rate conversion, calibration construction, and format encoding to cancellable module workers. Preview and export share canonical state. Source sample rate is preserved by default; explicit 44.1–192 kHz conversion uses quality-scaled windowed-sinc kernels and is re-verified after conversion. Upsampling never claims to create detail.

## Accuracy and terminology

Signal Rot does not claim Dolby authoring, object recovery, head tracking, measured individualized HRTFs, or certified BS.1770/true-peak compliance. ADM exports are channel beds. Binaural is a fixed parametric-HRTF render. Synthetic upmixing does not recreate absent spatial information. See [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md) and [`docs/FORMAT-COMPATIBILITY.md`](docs/FORMAT-COMPATIBILITY.md).

## Documentation

Start with [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), then the stereo, immersive, binaural, ADM, Sonic Lab, loudness, true-peak, presets, testing, and compatibility documents in `docs/`.
