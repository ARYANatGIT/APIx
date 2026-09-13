# scratch/check_deck_light.py
import re

with open('frontend/my-react-app/src/App.css', encoding='utf-8') as f:
    text = f.read()

light_rules = re.findall(r'\[data-theme="light"\][^{]+', text)
print(f"Total light mode rules in App.css: {len(light_rules)}")

# Check components coverage in light mode
categories = {
    'spikes/intel': 0,
    'deck/macro': 0,
    'routes/map': 0,
    'trajectory/chart': 0,
    'windows': 0,
    'airlines': 0,
    'quotes': 0,
    'scraper': 0,
    'export': 0,
    'modals': 0,
    'header/nav': 0,
    'airport3d': 0
}

for lr in light_rules:
    lr_lower = lr.lower()
    if any(k in lr_lower for k in ['spike', 'hud', 'chat', 'intel', 'feed']):
        categories['spikes/intel'] += 1
    if any(k in lr_lower for k in ['deck', 'mospi', 'macro', 'kpi', 'horizon', 'sigma', 'formula']):
        categories['deck/macro'] += 1
    if any(k in lr_lower for k in ['route', 'india-air', 'radar-panel', 'corridor']):
        categories['routes/map'] += 1
    if any(k in lr_lower for k in ['chart', 'trend', 'trajectory']):
        categories['trajectory/chart'] += 1
    if any(k in lr_lower for k in ['window', 'curve', 'outlier']):
        categories['windows'] += 1
    if any(k in lr_lower for k in ['airline', 'carrier', 'market-share']):
        categories['airlines'] += 1
    if any(k in lr_lower for k in ['quote', 'proof']):
        categories['quotes'] += 1
    if any(k in lr_lower for k in ['scraper', 'crawler', 'pipeline']):
        categories['scraper'] += 1
    if any(k in lr_lower for k in ['export', 'dataset', 'nso', 'archive']):
        categories['export'] += 1
    if any(k in lr_lower for k in ['modal', 'dialog', 'popup']):
        categories['modals'] += 1
    if any(k in lr_lower for k in ['nav', 'header', 'sidebar', 'brand', 'logo', 'menu']):
        categories['header/nav'] += 1
    if any(k in lr_lower for k in ['airport3d', 'fids', 'aerodrome', 'radar-canvas', 'roaming']):
        categories['airport3d'] += 1

print("\nLight mode rule distribution:")
for cat, count in categories.items():
    print(f"  {cat}: {count} rules")

