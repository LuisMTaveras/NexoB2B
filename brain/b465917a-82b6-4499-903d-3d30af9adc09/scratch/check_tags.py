
import re

with open(r'c:\B2B\client\src\modules\integrations\views\IntegrationsView.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# Focus only on the template part
template_match = re.search(r'<template>(.*)</template>', content, re.DOTALL)
if template_match:
    template = template_match.group(1)
    
    # Very basic tag counter
    opens = re.findall(r'<div[ >]', template)
    closes = re.findall(r'</div>', template)
    
    print(f"Open DIVs: {len(opens)}")
    print(f"Close DIVs: {len(closes)}")
    
    # Check for other common tags
    span_opens = re.findall(r'<span[ >]', template)
    span_closes = re.findall(r'</span>', template)
    print(f"Open SPANs: {len(span_opens)}")
    print(f"Close SPANs: {len(span_closes)}")
    
    # Trace the balance
    stack = []
    lines = template.split('\n')
    for i, line in enumerate(lines):
        # This is very naive but might find something
        for match in re.finditer(r'<(/?)(div|span|template|Transition|Icon|button|form|h[1-6]|p|label|select|input|textarea|router-link|badge)[ >/]', line):
            tag = match.group(2)
            is_close = match.group(1) == '/'
            is_self_close = line[match.end()-2:match.end()] == '/>' or tag in ['input', 'img', 'br', 'hr']
            
            if is_self_close and not is_close:
                continue
            
            if is_close:
                if not stack:
                    print(f"Error: Closing tag {tag} with no match at line {i+1}")
                else:
                    last = stack.pop()
                    if last != tag:
                        print(f"Error: Tag mismatch at line {i+1}: expected {last}, found {tag}")
            else:
                stack.append(tag)
    
    if stack:
        print(f"Error: Unclosed tags: {stack}")
else:
    print("No template found")
