# ADM BWF

Signal Rot writes RIFF/WAVE files containing `fmt ` (WAVE_FORMAT_EXTENSIBLE PCM24), `bext` version 2, `axml`, `chna`, and `data`. The XML describes one DirectSpeakers bed with channel, pack, object, programme, content, and track UID references. Export validation checks RIFF sizes, chunk bounds/padding, XML structure, track/UID counts, and required chunks.

This is an ADM BWF bed interchange file, not a Dolby Atmos master and not object-authored content. Internal validation is not a substitute for EBU ADM validation software or importer qualification. Compatibility is expected to vary for custom/Sonic layouts.
