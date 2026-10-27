"""Join rendered shots + mix music/sfx into final trailers.
python3 assemble.py h            -> final/sweet_home_reset_alpha_trailer_16x9.mp4
python3 assemble.py v A|B|C      -> final/sweet_home_reset_alpha_trailer_vertical_A.mp4
"""
import os, subprocess, sys
sys.path.insert(0, os.path.dirname(__file__))
import audio

fmt = sys.argv[1]
var = sys.argv[2] if len(sys.argv) > 2 else ''
os.makedirs('final', exist_ok=True)


def clip(shot):
    if fmt == 'v' and shot in ('sneeze', 'bubble'):
        return f'out/v_{shot}{var}.mp4'
    return f'out/{fmt}_{shot}.mp4'


shots = [s for s, _, _ in audio.MAP[fmt]]
files = [clip(s) for s in shots]
for f in files:
    assert os.path.exists(f), f
name = 'final/sweet_home_reset_alpha_trailer_' + ('16x9' if fmt == 'h' else f'vertical_{var}')
lst = f'{name}.txt'
with open(lst, 'w') as fh:
    for f in files:
        fh.write(f"file '{os.path.abspath(f)}'\n")
wav = f'{name}.wav'
specs = [f"{f.replace('.mp4', '.sfx.json')}:{s}" for f, s in zip(files, shots)]
subprocess.run(['python3', 'audio.py', 'mix', fmt, wav, *specs], check=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-i', wav,
                '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
                '-r', '60', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', f'{name}.mp4'], check=True)
os.remove(lst)
print('done', f'{name}.mp4')
