#!/bin/sh
# assemble4.sh <A|B|C|H>
set -e
X=$1; FMT=v; [ "$X" = H ] && FMT=h
python3 audio3.py ${X}4 final/v4_$X.wav out/${FMT}_v4$X.sfx.json
NAME=$( [ "$X" = H ] && echo sweet_home_reset_v4_16x9 || echo sweet_home_reset_v4_vertical_$X )
ffmpeg -y -loglevel error -i out/${FMT}_v4$X.mp4 -i final/v4_$X.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -r 60 -c:a aac -b:a 256k -shortest -movflags +faststart final/$NAME.mp4
echo final/$NAME.mp4
