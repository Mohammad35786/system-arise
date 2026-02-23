import os

file_path = r'd:\my projects\my research\test here\SYSTEM-ARISE-vscode\src\pages\Home.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'SWAP' in line:
        print(f"Line {i+1}: {repr(line)}")
        if '<->' in line:
            new_line = line.replace('<->', "{'<->'}")
            print(f"Replacing with: {repr(new_line)}")
            lines[i] = new_line

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Processing complete.")
