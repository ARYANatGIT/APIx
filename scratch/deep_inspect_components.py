# scratch/deep_inspect_components.py
import os
import re

src_dir = r"c:\SIH-26056\frontend\my-react-app\src"

def check_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Check for hardcoded dark background / text / borders in inline styles
    # Patterns like style={{ background: '#...', color: '#...' }}
    styles = re.findall(r'style=\{\{([^}]+)\}\}', content)
    problematic_styles = []
    for s in styles:
        if any(c in s for c in ['#0', '#1', '#2', '#3', '#F', '#f', 'rgb', 'rgba', 'gray', 'white', 'black']):
            problematic_styles.append(s.strip())
    
    return problematic_styles

results = {}
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.jsx'):
            p = os.path.join(root, file)
            probs = check_file(p)
            if probs:
                rel = os.path.relpath(p, src_dir)
                results[rel] = probs

print(f"Components with inline styles containing color/bg values ({len(results)} files):")
for f, p in sorted(results.items(), key=lambda x: len(x[1]), reverse=True):
    print(f"\n--- {f} ({len(p)} occurrences) ---")
    for sample in p[:5]:
        print("   ", sample[:100])

