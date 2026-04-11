
import re

with open(r'c:\B2B\client\src\modules\integrations\views\IntegrationsView.vue', 'r', encoding='utf-8') as f:
    content = f.read()

template_match = re.search(r'<template>(.*)</template>', content, re.DOTALL)
if template_match:
    template = template_match.group(1)
    
    stack = []
    lines = template.split('\n')
    for i, line in enumerate(lines):
        # We need to find all tags in the line
        matches = list(re.finditer(r'<(/?)([a-zA-Z0-9:-]+)[ >/]', line))
        for match in matches:
            tag = match.group(2)
            is_close = match.group(1) == '/'
            
            # Skip self-closing and special Vue tags
            if tag in ['input', 'img', 'br', 'hr', 'Icon', 'Transition', 'router-link', 'badge']:
                continue
                
            if is_close:
                if not stack:
                    print(f"[{i+1}] EXTRA CLOSING {tag}: {line.strip()}")
                else:
                    last = stack.pop()
                    if last != tag:
                        print(f"[{i+1}] MISMATCH: found {tag}, expected {last}. Line: {line.strip()}")
            else:
                stack.append(tag)
    
    if stack:
        print(f"Unclosed tags at end: {stack}")
else:
    print("No template found")
