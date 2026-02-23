import re
import os

file_path = r'd:\my projects\my research\test here\SYSTEM-ARISE-vscode\src\pages\Home.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    r'Ã°Å¸â€œâ€¹': '',
    r'Ã¢Å“â€œ': 'done',
    r'Ã¢Å¡Â ': '!',
    r'Ã¢Å¡Â¡': '!',
    r'Ã¢Å¡â€ ': 'x',
    r'Ã°Å¸â€ Â¥': '*',
    r'Ã¢â€”Å’': 'o',
    r'Ã¢â€”â€ ': '+',
    r'Ã¢â€”Â‹': 'o',
    r'Ã¢â€ â€ ': '<->',
    r'Ã¢Å“â€¢': 'X',
    r'Ãƒâ€”': '*',
    r'Ã‚Â·': '.',
    r'Ã¢â‚¬â€': '-',
    r'Ã¢â€“Â¼': 'v', # Final fallback for any missed chevrons
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Also handle common variants if any
content = content.replace('✓', 'done')
content = content.replace('⚠', '!')
content = content.replace('⚡', '!')
content = content.replace('⚔', 'x')
content = content.replace('🔥', '*')
content = content.replace('◌', 'o')
content = content.replace('▵', '+')
content = content.replace('○', 'o')
content = content.replace('·', '.')
content = content.replace('—', '-')
content = content.replace('✕', 'X')
content = content.replace('×', '*')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement complete.")
