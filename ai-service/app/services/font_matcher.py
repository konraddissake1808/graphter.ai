import os
import tempfile
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from app.services.font_detector import detect_font_features

# Sample text used to render each dataset font for feature extraction
_SAMPLE_TEXT = "AaBbCcDdEe 0123"
_RENDER_SIZE = 150   # pt — large enough to give clean edges and pass w>50
_IMG_W, _IMG_H = 1600, 300



def render_font_to_image(font_path: str, tmp_dir: str) -> str:
    """
    Render _SAMPLE_TEXT using the given TTF/OTF font file, save as a
    temporary PNG, and return its path.
    """
    img = Image.new("RGB", (_IMG_W, _IMG_H), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(font_path, _RENDER_SIZE)
    draw.text((20, (_IMG_H - _RENDER_SIZE) // 2), _SAMPLE_TEXT, fill=(0, 0, 0), font=font)

    tmp_path = os.path.join(tmp_dir, os.path.basename(font_path) + "_render.png")
    img.save(tmp_path)
    return tmp_path


def build_dataset_features(dataset_dir: str) -> dict:
    """
    Iterate all .ttf/.otf files in dataset_dir, render each, extract features.
    Returns { font_stem: np.ndarray }.
    """
    results = {}
    extensions = (".ttf", ".otf")

    with tempfile.TemporaryDirectory() as tmp_dir:
        for fname in os.listdir(dataset_dir):
            if not fname.lower().endswith(extensions):
                continue

            font_path = os.path.join(dataset_dir, fname)
            font_stem = os.path.splitext(fname)[0]

            try:
                rendered_path = render_font_to_image(font_path, tmp_dir)
                features = detect_font_features(rendered_path)
                results[font_stem] = features
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


def match_fonts(query_features: np.ndarray, dataset_dir: str, top_k: int = 5) -> list:
    """
    Compare query_features against every font in dataset_dir.
    Returns a list of dicts sorted by descending similarity:
      [{ "name": str, "similarity": float }, ...]
    """
    dataset = build_dataset_features(dataset_dir)

    if not dataset:
        return []

    scored = [
        {"name": font_name, "similarity": round(_cosine_similarity(query_features, feat), 4)}
        for font_name, feat in dataset.items()
    ]

    scored.sort(key=lambda x: x["similarity"], reverse=True)
    return scored[:top_k]

def get_related_fonts(target_font_name: str, dataset_dir: str, top_k: int = 5) -> dict:
    """
    Get similar and complementary fonts for a given target font name.
    Similar: closest feature vectors via cosine similarity.
    Complementary: invert density and stroke width to find contrasting fonts.
    """
    dataset = build_dataset_features(dataset_dir)
    
    if target_font_name not in dataset or len(dataset) < 2:
        return {"similar": [], "complementary": []}
        
    target_features = dataset[target_font_name]
    
    # 1. Similar Fonts
    similar = []
    for name, feat in dataset.items():
        if name != target_font_name:
            sim = round(_cosine_similarity(target_features, feat), 4)
            similar.append({"name": name, "similarity": sim})
            
    similar.sort(key=lambda x: x["similarity"], reverse=True)
    
    # 2. Complementary Fonts
    # Features: [0] mean_edge_density, [1] mean_aspect_ratio, [2] std_aspect_ratio, [3] stroke_width
    # To find a complementary font (e.g. bold header with thin body), we invert the thickness features.
    
    # Find max values across dataset to invert properly
    max_density = max([feat[0] for feat in dataset.values()]) or 1.0
    max_stroke = max([feat[3] for feat in dataset.values()]) or 1.0
    
    inverted_features = np.array([
        max_density - target_features[0],
        target_features[1], # keep aspect ratio similar
        target_features[2], 
        max_stroke - target_features[3]
    ], dtype=np.float32)
    
    complementary = []
    for name, feat in dataset.items():
        if name != target_font_name:
            # We use cosine similarity against the *inverted* vector
            sim = round(_cosine_similarity(inverted_features, feat), 4)
            complementary.append({"name": name, "similarity": sim})
            
    complementary.sort(key=lambda x: x["similarity"], reverse=True)
    
    return {
        "similar": similar[:top_k],
        "complementary": complementary[:top_k]
    }
