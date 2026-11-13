# Где остановились: Shorts «Что, если на Земле пропадёт интернет?»

Готово:
- Сценарий (`SCRIPT_SHORTS.md`) и голос Liam (`negative-iq/assets/voice_net/`, 2:20).
- Таймлайн (`negative-iq/tools/plan_net.py` → `src/net/timeline.json`, 2:22, 43 сцены).
- Сцены и оверлеи (`negative-iq/src/net/`), композиция `NoInternet` (1080×1920); кадры проверены и поправлены.
- Звук: новые SFX и фоновые звуки сцен, микс в `out/audio_net/mix.wav` (не в git, пересобирается: `python3 -I tools/audio/mix.py src/net/timeline.json out/audio_net`).
- Обложка `final/publish_net/cover_9x16.png`, название, описание и теги в `final/publish_net/PUBLISH.md`.

Готово: видео `negative-iq/final/no_internet_9x16.mp4` (для GitHub) и отправлено в чат в полном качестве. Проверка: без чёрных и застывших участков, громкость −14 LUFS.

