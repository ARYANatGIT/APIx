# scratch/audit_light_mode_and_responsive.py
import re
import os

app_css_path = r"c:\SIH-26056\frontend\my-react-app\src\App.css"
with open(app_css_path, "r", encoding="utf-8") as f:
    app_css = f.read()

light_rules = re.findall(r'\[data-theme=[^\]]+\][^{]*', app_css)
print(f"Total [data-theme] selectors in App.css: {len(light_rules)}")
for lr in light_rules[:20]:
    print("  ", lr.strip()[:90])

# Check hardcoded colors in JSX components
components_dir = r"c:\SIH-26056\frontend\my-react-app\src\components"
hardcoded_dark = {}
for fname in os.listdir(components_dir):
    if fname.endswith(".jsx"):
        fpath = os.path.join(components_dir, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        dark_matches = re.findall(r'(?:color|background|backgroundColor|borderColor|border):\s*[\'"](#(?:0A0A0A|0F172A|161922|0B0F19|0D0E12|1E293B|262E3F|FAFAFA|FFFFFF|111827|1F2937|374151|4B5563|94A3B8|CBD5E1))[\'"]', content)
        if dark_matches:
            hardcoded_dark[fname] = len(dark_matches)

print("\nHardcoded dark/light color styles in JSX components:")
for k, v in sorted(hardcoded_dark.items(), key=lambda x: -x[1]):
    print(f"  {k}: {v} inline color definitions")

