#!/usr/bin/env python3
import subprocess
import os
import sys

project_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(project_dir)

commands = [
    ['git', 'add', 'bot.js'],
    ['git', 'commit', '-m', 'feat: bot.js v3.0 con escalacion + memoria + estado persistente'],
    ['git', 'push', 'origin', 'main']
]

for cmd in commands:
    print(f'Ejecutando: {" ".join(cmd)}')
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(result.stdout)
        if result.stderr:
            print(result.stderr)
    except subprocess.CalledProcessError as e:
        print(f'Error: {e.stderr}')
        sys.exit(1)

print('✅ Push completado exitosamente')
