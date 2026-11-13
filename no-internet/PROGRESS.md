# Где остановились: Shorts «Что, если на Земле пропадёт интернет?»

Готово:
- Сценарий (`SCRIPT_SHORTS.md`) и голос Liam (`negative-iq/assets/voice_net/`, 2:20).
- Таймлайн (`negative-iq/tools/plan_net.py` → `src/net/timeline.json`, 2:22, 43 сцены).
- Сцены и оверлеи (`negative-iq/src/net/`), композиция `NoInternet` (1080×1920); кадры проверены и поправлены.
- Звук: новые SFX и фоновые звуки сцен, микс в `out/audio_net/mix.wav` (не в git, пересобирается: `python3 -I tools/audio/mix.py src/net/timeline.json out/audio_net`).
- Обложка `final/publish_net/cover_9x16.png`, название, описание и теги в `final/publish_net/PUBLISH.md`.

Идёт: полный рендер `out/render_net/video.mp4`
(`npx remotion render src/index.ts NoInternet out/render_net/video.mp4 --concurrency=2 --crf=18`).

Дальше: свести видео со звуком в `final/no_internet_9x16.mp4`, запустить `scripts/qa.sh`, отправить видео в чат, закоммитить.
