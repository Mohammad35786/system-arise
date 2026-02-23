import re
import os

file_path = r'd:\my projects\my research\test here\SYSTEM-ARISE-vscode\src\pages\Home.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace any multi-byte garbled characters starting with Ã with their ASCII equivalents or empty string
# Based on the typical garbling observed:
content = content.replace('Ã¢â€ â€', '<->')
content = content.replace('Ã¢â‚¬â€', '-')
content = content.replace('Ã‚Â·', '.')
content = content.replace('Ãƒâ€”', '*')
content = content.replace('Ã¢Å“â€¢', 'X')
content = content.replace('Ã¢â€“Â¼', 'v')
content = content.replace('Ã°Å¸â€œâ€¹', '')
content = content.replace('Ã¢Å“â€œ', 'done')
content = content.replace('Ã¢Å¡Â ', '!')
content = content.replace('Ã¢Å¡Â¡', '!')
content = content.replace('Ã¢Å¡â€ ', 'x')
content = content.replace('Ã°Å¸â€ Â¥', '*')
content = content.replace('Ã¢â€”Å’', 'o')
content = content.replace('Ã¢â€”â€ ', '+')
content = content.replace('Ã¢â€”Â‹', 'o')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Final scrub complete.")
