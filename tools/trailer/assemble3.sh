#!/bin/sh
# assemble3.sh <A|B|C|H>
set -e
X=$1; FMT=v; [ "$X" = H ] && FMT=h
python3 audio3.py $X final/v3_$X.wav out/${FMT}_v3$X.sfx.json
NAME=$( [ "$X" = H ] && echo sweet_home_reset_v3_16x9 || echo sweet_home_reset_v3_vertical_$X )
ffmpeg -y -loglevel error -i out/${FMT}_v3$X.mp4 -i final/v3_$X.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -r 60 -c:a aac -b:a 256k -shortest -movflags +faststart final/$NAME.mp4
echo final/$NAME.mp4
