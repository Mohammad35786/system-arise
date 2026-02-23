import os

file_path = r'd:\my projects\my research\test here\SYSTEM-ARISE-vscode\src\pages\Home.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open(file_path, 'w', encoding='utf-8') as f:
    for line in lines:
        if 'SWAP <-> ' in line:
            line = line.replace('SWAP <-> ', "SWAP {'<->'}")
        f.write(line)

print("JSX fix complete.")
