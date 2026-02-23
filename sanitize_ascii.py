import os

file_path = r'd:\my projects\my research\test here\SYSTEM-ARISE-vscode\src\pages\Home.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace any character with code > 127 with nothing, except common intended ones if any
# But the user asked for clean ASCII, so I'll strip everything non-ASCII
sanitized = "".join(i for i in content if ord(i) < 128)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(sanitized)

print("ASCII sanitization complete.")
