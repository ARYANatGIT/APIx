# scratch/update_scraper_health.py
import re

file_path = r"c:\SIH-26056\frontend\my-react-app\src\components\ScraperHealthView.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update component signature
content = content.replace(
    "export default function ScraperHealthView({ logs: initialLogs = [], scraperStats = {} }) {",
    "export default function ScraperHealthView({ logs: initialLogs = [], scraperStats = {}, theme = 'dark' }) {\n  const isLight = theme === 'light';\n  const T = {\n    cardBg: isLight ? '#FFFFFF' : 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)',\n    border: isLight ? '#E2E8F0' : 'rgba(251, 230, 151, 0.25)',\n    borderSub: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.06)',\n    subBoxBg: isLight ? '#F8FAFC' : 'rgba(0, 0, 0, 0.25)',\n    titleText: isLight ? '#0F172A' : '#F8FAFC',\n    textMuted: isLight ? '#64748B' : '#94A3B8',\n    textValue: isLight ? '#0284C7' : '#FBE697',\n    selectOptionBg: isLight ? '#FFFFFF' : '#1E293B',\n    selectOptionText: isLight ? '#0F172A' : '#FFFFFF',\n    modalBg: isLight ? '#FFFFFF' : '#0B0F19',\n    modalBorder: isLight ? '#CBD5E1' : '#1E293B',\n  };"
)

# 2. Update panel styling
content = content.replace(
    "background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)',\n          border: '1px solid rgba(251, 230, 151, 0.25)',\n          borderRadius: '12px',\n          padding: '20px',\n          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',\n          backdropFilter: 'blur(10px)'",
    "background: T.cardBg,\n          border: `1px solid ${T.border}`,\n          borderRadius: '12px',\n          padding: '20px',\n          boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.04)' : '0 8px 24px rgba(0,0,0,0.3)',\n          backdropFilter: 'blur(10px)'"
)

# 3. Update inner info boxes
content = content.replace(
    "background: 'rgba(0,0,0,0.25)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)'",
    "background: T.subBoxBg, padding: '10px 12px', borderRadius: '8px', border: `1px solid ${T.borderSub}`"
)

# 4. Update panel titles
content = content.replace(
    "margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC'",
    "margin: 0, fontSize: '0.95rem', fontWeight: 700, color: T.titleText"
)

# 5. Update dual panel responsive grid from 360px to 280px
content = content.replace(
    "gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))'",
    "gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'"
)

# 6. Update select options styling
content = content.replace(
    "style={{ background: '#1E293B', color: '#FFF' }}",
    "style={{ background: T.selectOptionBg, color: T.selectOptionText }}"
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated ScraperHealthView.jsx successfully!")

