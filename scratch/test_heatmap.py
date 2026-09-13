# scratch/test_heatmap.py
import sys
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, '.')

from backend.index_calculator import compute_heatmap_data
data = compute_heatmap_data()

for c in data.get('corridors', []):
    levels = [cell['level'] for cell in c['cells']]
    from collections import Counter
    cnts = Counter(levels)
    sample_fares = [cell['fare'] for cell in c['cells'][:3]]
    print(f"{c['route_code']}: Avg ₹{c['average_fare']} | Level counts: {dict(cnts)} | Sample: {sample_fares}")
