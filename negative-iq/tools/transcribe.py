import sys, json
from faster_whisper import WhisperModel
model_dir, audio, out = sys.argv[1:4]
m = WhisperModel(model_dir, device="cpu", compute_type="int8", cpu_threads=4)
import subprocess, numpy as np
raw=subprocess.run(["ffmpeg","-loglevel","error","-i",audio,"-f","f32le","-ac","1","-ar","16000","-"],capture_output=True).stdout
arr=np.frombuffer(raw,dtype=np.float32)
segs, info = m.transcribe(arr, language="ru", word_timestamps=True, beam_size=5, vad_filter=False)
words=[]; lines=[]
for s in segs:
    lines.append(f"[{s.start:7.2f}-{s.end:7.2f}] {s.text.strip()}")
    for w in s.words:
        words.append({"w": w.word.strip(), "s": round(w.start,3), "e": round(w.end,3), "p": round(w.probability,3)})
json.dump(words, open(out,"w"), ensure_ascii=False, indent=0)
print("\n".join(lines))
