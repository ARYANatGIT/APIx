# scratch/update_airport_twin.py
import re

file_path = r"c:\SIH-26056\frontend\my-react-app\src\components\Airport3DDigitalTwin.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Ensure theme object T is declared before return
theme_palette = """  const isLight = theme === 'light';
  const T = {
    rootColor: isLight ? '#0F172A' : '#FAFAFA',
    textMuted: isLight ? '#64748B' : '#94A3B8',
    textSub: isLight ? '#475569' : '#CBD5E1',
    textBright: isLight ? '#0F172A' : '#FAFAFA',
    cardBg: isLight ? '#FFFFFF' : '#161922',
    cardBgAlt: isLight ? '#F8FAFC' : '#0D111A',
    cardBgDark: isLight ? '#F1F5F9' : '#0A0E1A',
    cardBorder: isLight ? '#E2E8F0' : '#262E3F',
    cardBorderAlt: isLight ? '#CBD5E1' : '#1E293B',
    btnBg: isLight ? '#F1F5F9' : '#1F2937',
    btnBorder: isLight ? '#CBD5E1' : '#374151',
    btnText: isLight ? '#0F172A' : '#F3F4F6',
    inputBg: isLight ? '#FFFFFF' : '#1E293B',
    inputBorder: isLight ? '#CBD5E1' : '#334155',
    inputText: isLight ? '#0F172A' : '#FFFFFF',
    tabBarBg: isLight ? '#F1F5F9' : '#0D0E12',
    tabBorder: isLight ? '#E2E8F0' : '#262626',
    tabActiveBg: isLight ? '#FFFFFF' : '#17191E',
    tableHeaderBg: isLight ? '#F1F5F9' : '#0D0E12',
    tableBorder: isLight ? '#E2E8F0' : '#262626',
    tableRowHover: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.02)',
    telemetryBoxBg: isLight ? '#F8FAFC' : '#0F172A',
    mapBorder: isLight ? '#CBD5E1' : '#262E3F',
    flightDrawerBg: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(11, 15, 25, 0.96)',
    flightDrawerBorder: isLight ? '#CBD5E1' : '#FACC15',
    flightDrawerText: isLight ? '#0F172A' : '#FFFFFF',
    tabsWrapperBg: isLight ? '#FFFFFF' : '#111317',
  };
"""

# Check if T is already present
if "const T = {" not in content:
    content = content.replace("  const financials = twinData?.financials_live;", theme_palette + "\n  const financials = twinData?.financials_live;")

# Replace root div
content = re.sub(
    r'<div style=\{\{\s*color:\s*\'#FAFAFA\',\s*fontFamily:\s*\'var\(--font-sans, system-ui, sans-serif\)\',\s*paddingBottom:\s*\'48px\'\s*\}\}>',
    r'<div style={{ color: T.rootColor, fontFamily: "var(--font-sans, system-ui, sans-serif)", paddingBottom: "48px" }}>',
    content
)

# Replace sync button styling
content = content.replace(
    "background: '#1F2937',\n              border: '1px solid #374151',\n              borderRadius: '8px',\n              color: '#F3F4F6',",
    "background: T.btnBg,\n              border: `1px solid ${T.btnBorder}`,\n              borderRadius: '8px',\n              color: T.btnText,"
)

# Replace airport pill container
content = content.replace(
    "style={{ background: '#0D111A', border: '1px solid #1E293B', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px' }}",
    "style={{ background: T.cardBgAlt, border: `1px solid ${T.cardBorderAlt}`, borderRadius: '12px', padding: '12px 16px', marginBottom: '20px' }}"
)

# Replace airport filter input
content = content.replace(
    "background: '#1E293B',\n                border: '1px solid #334155',\n                borderRadius: '6px',\n                color: '#FFFFFF',",
    "background: T.inputBg,\n                border: `1px solid ${T.inputBorder}`,\n                borderRadius: '6px',\n                color: T.inputText,"
)

# Replace unselected airport pill
content = content.replace(
    "border: isSelected ? `1.5px solid ${ap.color}` : '1px solid #262E3F',\n                  background: isSelected ? 'rgba(30, 41, 59, 0.95)' : '#111827',\n                  color: isSelected ? '#FFFFFF' : '#94A3B8',",
    "border: isSelected ? `1.5px solid ${ap.color}` : `1px solid ${T.cardBorder}`,\n                  background: isSelected ? (isLight ? '#EFF6FF' : 'rgba(30, 41, 59, 0.95)') : (isLight ? '#FFFFFF' : '#111827'),\n                  color: isSelected ? (isLight ? '#1D4ED8' : '#FFFFFF') : T.textMuted,"
)

# Map height to responsive clamp
content = re.sub(
    r'<div style=\{\{\s*position:\s*\'relative\',\s*width:\s*\'100%\',\s*height:\s*\'620px\',\s*borderRadius:\s*\'12px\',\s*overflow:\s*\'hidden\',\s*border:\s*\'1\.5px solid #262E3F\',\s*marginBottom:\s*\'24px\',\s*background:\s*\'#05070D\'\s*\}\}>',
    r'<div style={{ position: "relative", width: "100%", height: "clamp(380px, 48vh, 620px)", borderRadius: "12px", overflow: "hidden", border: `1.5px solid ${T.mapBorder}`, marginBottom: "24px", background: isLight ? "#E2E8F0" : "#05070D" }}>',
    content
)

# Flight Drawer responsive
content = content.replace(
    "top: '14px',\n            right: '16px',\n            width: '360px',\n            maxHeight: '590px',",
    "top: '14px',\n            right: '14px',\n            width: 'min(360px, calc(100% - 28px))',\n            maxHeight: 'calc(100% - 28px)',"
)

content = content.replace(
    "background: 'rgba(11, 15, 25, 0.96)',\n            backdropFilter: 'blur(16px)',\n            border: '2px solid #FACC15',",
    "background: T.flightDrawerBg,\n            backdropFilter: 'blur(16px)',\n            border: `2px solid ${T.flightDrawerBorder}`,"
)

content = content.replace(
    "boxShadow: '0 12px 40px rgba(0,0,0,0.9)',\n            color: '#FFFFFF'",
    "boxShadow: isLight ? '0 12px 32px rgba(0,0,0,0.15)' : '0 12px 40px rgba(0,0,0,0.9)',\n            color: T.flightDrawerText"
)

# Tab wrapper
content = content.replace(
    "style={{ background: '#111317', border: '1px solid #262626', borderRadius: '12px', overflow: 'hidden' }}",
    "style={{ background: T.tabsWrapperBg, border: `1px solid ${T.tabBorder}`, borderRadius: '12px', overflow: 'hidden' }}"
)

# Tab header bar
content = content.replace(
    "style={{ display: 'flex', borderBottom: '1px solid #262626', background: '#0D0E12', overflowX: 'auto' }}",
    "style={{ display: 'flex', borderBottom: `1px solid ${T.tabBorder}`, background: T.tabBarBg, overflowX: 'auto' }}"
)

# Tab buttons active/inactive
content = content.replace(
    "background: isActive ? '#17191E' : 'transparent',\n                  border: 'none',\n                  borderBottom: isActive ? '2px solid #FACC15' : '2px solid transparent',\n                  color: isActive ? '#FAFAFA' : '#737373',",
    "background: isActive ? T.tabActiveBg : 'transparent',\n                  border: 'none',\n                  borderBottom: isActive ? '2px solid #FF3D00' : '2px solid transparent',\n                  color: isActive ? (isLight ? '#0F172A' : '#FAFAFA') : T.textMuted,"
)

# Tab button icon
content = content.replace(
    "<Icon size={14} style={{ color: isActive ? '#FACC15' : '#737373' }} />",
    "<Icon size={14} style={{ color: isActive ? '#FF3D00' : T.textMuted }} />"
)

# Financials cards (Aeronautical, Non-Aeronautical, Concession)
content = content.replace(
    "style={{ background: '#161922', border: '1px solid #262E3F', borderRadius: '8px', padding: '16px' }}",
    "style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: '8px', padding: '16px', boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.04)' : 'none' }}"
)

content = content.replace(
    "fontSize: '24px', fontWeight: 800, color: '#FAFAFA', fontFamily: 'monospace'",
    "fontSize: '24px', fontWeight: 800, color: T.textBright, fontFamily: 'monospace'"
)

# Mathematical formula note in Financials
content = content.replace(
    "style={{ background: '#0A0E1A', border: '1px solid #1E293B', borderRadius: '8px', padding: '12px 16px', fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '10px' }}",
    "style={{ background: T.cardBgDark, border: `1px solid ${T.cardBorderAlt}`, borderRadius: '8px', padding: '12px 16px', fontSize: '12px', color: T.textMuted, display: 'flex', alignItems: 'center', gap: '10px' }}"
)

# Airspace search input
content = content.replace(
    "background: '#161922',\n                      border: '1px solid #262E3F',\n                      borderRadius: '6px',\n                      color: '#FFFFFF',",
    "background: T.inputBg,\n                      border: `1px solid ${T.inputBorder}`,\n                      borderRadius: '6px',\n                      color: T.inputText,"
)

# Airspace table headers and borders
content = content.replace(
    "<thead style={{ position: 'sticky', top: 0, background: '#0D0E12', zIndex: 10 }}>\n                    <tr style={{ borderBottom: '1px solid #262626', color: '#94A3B8', fontFamily: 'monospace' }}>",
    "<thead style={{ position: 'sticky', top: 0, background: T.tableHeaderBg, zIndex: 10 }}>\n                    <tr style={{ borderBottom: `1px solid ${T.tableBorder}`, color: T.textMuted, fontFamily: 'monospace' }}>"
)

# Airspace filter buttons
content = content.replace(
    "border: isSelected ? '1px solid #FACC15' : '1px solid #262E3F',\n                          background: isSelected ? 'rgba(250, 204, 21, 0.15)' : '#161922',\n                          color: isSelected ? '#FACC15' : '#CBD5E1',",
    "border: isSelected ? '1px solid #FF3D00' : `1px solid ${T.cardBorder}`,\n                          background: isSelected ? (isLight ? '#FFF7ED' : 'rgba(250, 204, 21, 0.15)') : (isLight ? '#FFFFFF' : '#161922'),\n                          color: isSelected ? '#FF3D00' : T.textSub,"
)

# FIDS tab departure/arrival buttons
content = content.replace(
    "background: fidsType === 'departures' ? '#FACC15' : '#1F2937',\n                      color: fidsType === 'departures' ? '#0F172A' : '#FFFFFF',",
    "background: fidsType === 'departures' ? '#FF3D00' : T.btnBg,\n                      color: fidsType === 'departures' ? '#FFFFFF' : T.btnText,"
)

content = content.replace(
    "background: fidsType === 'arrivals' ? '#FACC15' : '#1F2937',\n                      color: fidsType === 'arrivals' ? '#0F172A' : '#FFFFFF',",
    "background: fidsType === 'arrivals' ? '#FF3D00' : T.btnBg,\n                      color: fidsType === 'arrivals' ? '#FFFFFF' : T.btnText,"
)

# Passenger Flow 4-Zone Cards
content = content.replace(
    "style={{ background: '#161922', border: '1px solid #262E3F', borderRadius: '8px', padding: '14px' }}",
    "style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: '8px', padding: '14px', boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.04)' : 'none' }}"
)

content = content.replace(
    "fontSize: '20px', fontWeight: 800, color: '#FAFAFA', fontFamily: 'monospace', marginTop: '6px'",
    "fontSize: '20px', fontWeight: 800, color: T.textBright, fontFamily: 'monospace', marginTop: '6px'"
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated Airport3DDigitalTwin.jsx successfully!")

