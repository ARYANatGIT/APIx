# scratch/audit_responsive.py
import re

with open(r"c:\SIH-26056\frontend\my-react-app\src\App.css", "r", encoding="utf-8") as f:
    app_css = f.read()

print("App.css total length:", len(app_css))

# Look for grid layouts, flex containers, overflow, fixed widths
fixed_widths = re.findall(r'width:\s*(\d{3,4}px)', app_css)
print(f"Fixed widths >= 100px: {len(fixed_widths)}, e.g. {set(fixed_widths)}")

min_widths = re.findall(r'min-width:\s*(\d{3,4}px)', app_css)
print(f"Min widths >= 100px: {len(min_widths)}, e.g. {set(min_widths)}")

# Let's inspect media queries in App.css
m_queries = re.findall(r'(@media[^{]+)\{', app_css)
for mq in m_queries:
    print("MQ:", mq.strip())

