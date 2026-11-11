#!/bin/sh
# QA of the final video: black / frozen spans, loudness, duration, contact sheets every 0.5 s.
# usage: sh scripts/qa.sh final.mp4 out/qa
V=$1; O=${2:-out/qa}; mkdir -p "$O"
echo "== duration / streams"; ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact "$V"
echo "== black frames (>0.3 s)"; ffmpeg -hide_banner -i "$V" -vf "blackdetect=d=0.3:pix_th=0.06" -an -f null - 2>&1 | grep blackdetect || echo none
echo "== frozen spans (>0.8 s)"; ffmpeg -hide_banner -i "$V" -vf "freezedetect=n=0.002:d=0.8" -an -f null - 2>&1 | grep -E "freeze_(start|duration)" || echo none
echo "== loudness"; ffmpeg -hide_banner -i "$V" -vn -af ebur128=peak=true -f null - 2>&1 | grep -A 12 "Summary" | grep -E "I:|Peak:|LRA:"
echo "== sheets"; ffmpeg -loglevel error -y -i "$V" -vf "fps=2,scale=160:-1,tile=12x5" "$O/sheet_%02d.png" && ls "$O"
