import os
import tempfile
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from sklearn.neighbors import KNeighborsClassifier

from app.services.font_detector import detect_font_features

# Multiple sample texts to generate robust KNN feature classes
_SAMPLE_TEXTS = [
    "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z",
    "a b c d e f g h i j k l m n o p q r s t u v w x y z",
    "0 1 2 3 4 5 6 7 8 9",
    "The quick brown fox jumps over the lazy dog",
    "Hamburgefontsiv"
]
_RENDER_SIZE = 100   # pt
_IMG_W, _IMG_H = 4000, 200



def render_font_to_images(font_path: str, tmp_dir: str) -> list:
    """
    Render _SAMPLE_TEXTS using the given TTF/OTF font file, save as multiple
    temporary PNGs, and return their paths.
    """
    paths = []
    font = ImageFont.truetype(font_path, _RENDER_SIZE)
    base_name = os.path.basename(font_path)
    
    for idx, text in enumerate(_SAMPLE_TEXTS):
        img = Image.new("RGB", (_IMG_W, _IMG_H), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        draw.text((20, (_IMG_H - _RENDER_SIZE) // 2), text, fill=(0, 0, 0), font=font)
        
        tmp_path = os.path.join(tmp_dir, f"{base_name}_{idx}.png")
        img.save(tmp_path)
        paths.append(tmp_path)
        
    return paths


def build_dataset_features(dataset_dir: str) -> dict:
    """
    Iterate all .ttf/.otf files, render sample texts, extract & aggregate features.
    Returns { font_stem: { "global": np.ndarray(5), "glyphs": [...] } }.
    """
    results = {}
    extensions = (".ttf", ".otf")

    with tempfile.TemporaryDirectory() as tmp_dir:
        for fname in os.listdir(dataset_dir):
            if not fname.lower().endswith(extensions):
                continue

            font_path = os.path.join(dataset_dir, fname)
            font_stem = os.path.splitext(fname)[0]

            all_glyphs = []
            global_accum = []
            try:
                rendered_paths = render_font_to_images(font_path, tmp_dir)
                for r_path in rendered_paths:
                    features = detect_font_features(r_path)
                    all_glyphs.extend(features.get("glyphs", []))
                    if features.get("global") is not None:
                        global_accum.append(features["global"])
                
                avg_global = np.mean(global_accum, axis=0) if global_accum else np.zeros(5, dtype=np.float32)
                
                results[font_stem] = {
                    "global": avg_global,
                    "glyphs": all_glyphs
                }
            except Exception as e:
                print(f"[font_matcher] Skipping {fname}: {e}")

    return results


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity clamped to [0, 1]."""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.clip(np.dot(a, b) / (norm_a * norm_b), 0.0, 1.0))


_DATASET_CACHE = {}
_KNN_MODEL = None
_FONT_CATEGORIES = {}

def classify_font_category(global_features: np.ndarray) -> str:
    """Classify into Serif, Sans-serif, Monospace, Display, or Handwriting."""
    if len(global_features) < 5:
        return "Sans-serif"
        
    mean_density = global_features[0]
    mean_aspect = global_features[1]
    std_aspect = global_features[2]
    stroke_width = global_features[3]
    corner_density = global_features[4]
    
    if std_aspect < 0.07:
        return "Monospace"
    elif std_aspect > 0.8:
        return "Handwriting"
    elif stroke_width > 0.5 or mean_density > 0.6:
        return "Display"
    elif corner_density > 4.0:
        return "Serif"
    else:
        return "Sans-serif"

def get_dataset_cache(dataset_dir: str):
    global _DATASET_CACHE, _FONT_CATEGORIES
    if not _DATASET_CACHE:
        _DATASET_CACHE = build_dataset_features(dataset_dir)
        for font_name, feat in _DATASET_CACHE.items():
            cat = classify_font_category(feat["global"])
            _FONT_CATEGORIES[font_name] = cat
    return _DATASET_CACHE

def get_knn_model(dataset_dir: str):
    global _KNN_MODEL, _FONT_CATEGORIES
    dataset = get_dataset_cache(dataset_dir)
    
    if _KNN_MODEL is None:
        X = []
        y = []
        for font_name, feat in dataset.items():
            for glyph in feat.get("glyphs", []):
                X.append(glyph)
                y.append(font_name)
                    
        if X:
            n_neighbors = min(15, len(X))
            knn = KNeighborsClassifier(n_neighbors=n_neighbors, metric='cosine', weights='distance')
            knn.fit(X, y)
            _KNN_MODEL = knn
            
    return _KNN_MODEL, dataset


from collections import Counter

def match_fonts(query_features: dict, dataset_dir: str, top_k: int = 5) -> dict:
    """
    Classify query font, then compare against ALL dataset fonts using KNN.
    Uses Distance Thresholding and Majority Voting to eliminate background noise.
    Returns: { "category": str, "matches": [{ "name": str, "similarity": float }, ...] }
    """
    query_global = query_features.get("global", np.zeros(5))
    category = classify_font_category(query_global)
    
    knn, dataset = get_knn_model(dataset_dir)

    if not knn or not dataset:
        return {"category": category, "matches": []}

    query_glyphs = query_features.get("glyphs", [])
    if not query_glyphs:
        return {"category": category, "matches": []}
        
    predictions = knn.predict(query_glyphs)
    distances, _ = knn.kneighbors(query_glyphs, n_neighbors=1)
    
    valid_predictions = []
    for i, dist in enumerate(distances):
        # Cosine distance < 0.6 means high structural similarity. 
        # If it's pure background noise, distance to any font letter will be extremely high.
        if dist[0] < 0.6:  
            valid_predictions.append(predictions[i])
            
    if not valid_predictions:
        valid_predictions = list(predictions)
        
    vote_counts = Counter(valid_predictions)
    total_votes = len(valid_predictions)
    
    classes = knn.classes_
    
    scored = []
    for font_name in classes:
        votes = vote_counts.get(font_name, 0)
        sim = float(votes) / total_votes if total_votes > 0 else 0.0
        scored.append({"name": font_name, "similarity": round(sim, 4)})

    scored.sort(key=lambda x: x["similarity"], reverse=True)
    return {
        "category": category,
        "matches": scored[:top_k]
    }

def get_related_fonts(target_font_name: str, dataset_dir: str, top_k: int = 5) -> dict:
    """
    Get similar and complementary fonts for a given target font name.
    Similar: closest feature vectors via cosine similarity.
    Complementary: invert density and stroke width to find contrasting fonts.
    """
    dataset = get_dataset_cache(dataset_dir)
    
    if target_font_name not in dataset or len(dataset) < 2:
        return {"similar": [], "complementary": []}
        
    target_features = dataset[target_font_name]["global"]
    
    # 1. Similar Fonts
    similar = []
    for name, feat in dataset.items():
        if name != target_font_name:
            sim = round(_cosine_similarity(target_features, feat["global"]), 4)
            similar.append({"name": name, "similarity": sim})
            
    similar.sort(key=lambda x: x["similarity"], reverse=True)
    
    # 2. Complementary Fonts
    # Features: [0] mean_edge_density, [1] mean_aspect_ratio, [2] std_aspect_ratio, [3] stroke_width
    # To find a complementary font (e.g. bold header with thin body), we invert the thickness features.
    
    # Find max values across dataset to invert properly
    max_density = max([feat["global"][0] for feat in dataset.values()]) or 1.0
    max_stroke = max([feat["global"][3] for feat in dataset.values()]) or 1.0
    max_corner = max([feat["global"][4] for feat in dataset.values()]) or 1.0
    
    inverted_features = np.array([
        max_density - target_features[0],
        target_features[1], # keep aspect ratio similar
        target_features[2], 
        max_stroke - target_features[3],
        max_corner - target_features[4] # invert the serif characteristics 
    ], dtype=np.float32)
    
    complementary = []
    for name, feat in dataset.items():
        if name != target_font_name:
            # We use cosine similarity against the *inverted* vector
            sim = round(_cosine_similarity(inverted_features, feat["global"]), 4)
            complementary.append({"name": name, "similarity": sim})
            
    complementary.sort(key=lambda x: x["similarity"], reverse=True)
    
    return {
        "similar": similar[:top_k],
        "complementary": complementary[:top_k]
    }
