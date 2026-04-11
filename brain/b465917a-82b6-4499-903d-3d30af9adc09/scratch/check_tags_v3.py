
import re

with open(r'c:\B2B\client\src\modules\integrations\views\IntegrationsView.vue', 'r', encoding='utf-8') as f:
    text = f.read()

# Remove comments
text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)

# Find template
match = re.search(r'<template>(.*)</template>', text, re.DOTALL)
if not match:
    print("No template")
    exit()

template = match.group(1)

# Tag regex
tag_re = re.compile(r'<(/?[a-zA-Z0-9:-]+)([^>]*?)(/?)>')

stack = []
for i, line in enumerate(template.split('\n')):
    for m in tag_re.finditer(line):
        tag_name = m.group(1)
        is_closing = tag_name.startswith('/')
        is_self_closing = m.group(3) == '/' or tag_name.lower() in ['input', 'img', 'br', 'hr', 'link', 'meta']
        
        if is_closing:
            tag_name = tag_name[1:]
            if not stack:
                print(f"[{i+1}] Extra closing tag: </{tag_name}>")
            else:
                top = stack.pop()
                if top != tag_name:
                    print(f"[{i+1}] Mismatch: found </{tag_name}>, expected </{top}>")
        elif not is_self_closing:
            stack.append(tag_name)

print(f"Final stack: {stack}")
