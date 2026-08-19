# Testing

`npm test` covers stereo DSP, preset safety, WAV import/export, UI server rendering, and a 150-render audition matrix. `npm run test:immersive` checks layouts, routing, Sonic mapping, calibration/identification, PCM24/float32 extensible WAV, ADM chunks/XML/UIDs, HRTF contribution, and loudness gates. `npm run test:e2e` renders and re-opens stereo, 5.1, 7.1.4, Sonic 20.4, binaural, and ADM outputs from one legal generated fixture.
