# scratch/update_nso_export.py
import re

file_path = r"c:\SIH-26056\frontend\my-react-app\src\components\NsoExportView.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update component signature
content = content.replace(
    "export default function NsoExportView({ routes = [], indexSeries = [], overviewData = {} }) {",
    "export default function NsoExportView({ routes = [], indexSeries = [], overviewData = {}, theme = 'dark' }) {\n  const isLight = theme === 'light';\n  const T = {\n    rootColor: isLight ? '#0F172A' : '#FAFAFA',\n    heading: isLight ? '#0F172A' : '#FFFFFF',\n    textMuted: isLight ? '#64748B' : '#94A3B8',\n    textSub: isLight ? '#475569' : '#CBD5E1',\n    cardBg: isLight ? '#FFFFFF' : '#121218',\n    cardBgAlt: isLight ? '#F8FAFC' : '#0B0F19',\n    border: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.08)',\n    borderAlt: isLight ? '#CBD5E1' : 'rgba(255,255,255,0.15)',\n    inputBg: isLight ? '#FFFFFF' : '#1A1A24',\n    inputBorder: isLight ? '#CBD5E1' : 'rgba(255,255,255,0.12)',\n    inputText: isLight ? '#0F172A' : '#FFFFFF',\n    codeBg: isLight ? '#F8FAFC' : '#0D0E12',\n    codeBorder: isLight ? '#E2E8F0' : '#1E293B',\n    tableHeaderBg: isLight ? '#F1F5F9' : '#161922',\n    tableBorder: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.08)',\n    bannerBg: isLight ? 'linear-gradient(135deg, rgba(255,61,0,0.06) 0%, rgba(255,255,255,0.95) 100%)' : 'linear-gradient(135deg, rgba(255, 61, 0, 0.08) 0%, rgba(18, 18, 24, 0.8) 100%)',\n    bannerBorder: isLight ? '#FED7AA' : 'rgba(255, 61, 0, 0.3)',\n  };"
)

# 2. Update Master ZIP package banner
content = content.replace(
    "background: 'linear-gradient(135deg, rgba(255, 61, 0, 0.08) 0%, rgba(18, 18, 24, 0.8) 100%)',\n        border: '1px solid rgba(255, 61, 0, 0.3)',",
    "background: T.bannerBg,\n        border: `1px solid ${T.bannerBorder}`,"
)

# 3. Update dataset cards
content = content.replace(
    "style={{ background: '#121218', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}",
    "style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.04)' : 'none' }}"
)

# 4. Update card titles and headings
content = re.sub(
    r'color:\s*\'#FFFFFF\'',
    r'color: T.heading',
    content
)

content = re.sub(
    r'color:\s*\'#CBD5E1\'',
    r'color: T.textSub',
    content
)

content = re.sub(
    r'color:\s*\'#94A3B8\'',
    r'color: T.textMuted',
    content
)

# 5. Update responsive grid from 320px to 280px
content = content.replace(
    "gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'",
    "gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'"
)

# 6. Update inputs and API tester boxes
content = content.replace(
    "background: '#1A1A24',\n              border: '1px solid rgba(255,255,255,0.12)',\n              borderRadius: '6px',\n              color: '#FFFFFF',",
    "background: T.inputBg,\n              border: `1px solid ${T.inputBorder}`,\n              borderRadius: '6px',\n              color: T.inputText,"
)

content = content.replace(
    "background: '#0B0F19',\n              border: '1px solid rgba(255,255,255,0.08)',",
    "background: T.codeBg,\n              border: `1px solid ${T.codeBorder}`,"
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated NsoExportView.jsx successfully!")

