import os
import re

file_path = r'd:\my projects\my research\test here\SYSTEM-ARISE-vscode\src\pages\Home.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find the Skill Quest button line
pattern = r'className="text\[#C9A84C\] font-mono text-\[10px\] hover:underline">SWAP.*?<\/button>'
replacement = 'className="text-[#C9A84C] font-mono text-[10px] hover:underline">SWAP {"<->"} </button>'

new_content = re.sub(pattern, replacement, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Aggressive JSX fix complete.")
