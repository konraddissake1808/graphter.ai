from app.services.font_detector import detect_font_features
from app.services.font_matcher import get_knn_model, match_fonts

print('--- Testing Font Detection ---')
feat = detect_font_features('googleSansTest.jpg')
glyphs = feat.get('glyphs', [])
print(f'Extracted {len(glyphs)} contours.')

if glyphs:
    knn, _ = get_knn_model('font-dataset')
    distances, indices = knn.kneighbors(glyphs, n_neighbors=1)
    predictions = knn.predict(glyphs)
    
    valid = 0
    for i, (p, d) in enumerate(zip(predictions, distances)):
        print(f'Glyph {i}: Predicted {p} (Dist: {d[0]:.3f})')
        if d[0] < 0.6:
            valid += 1
            
    print(f'Valid votes (<0.6): {valid}/{len(glyphs)}')

print('--- Matcher Result ---')
res = match_fonts(feat, 'font-dataset')
import json
print(json.dumps(res, indent=2))
