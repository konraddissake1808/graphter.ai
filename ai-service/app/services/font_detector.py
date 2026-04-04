import cv2
import numpy as np


def detect_font_features(image_path: str) -> dict:
    """
    Extract global features and advanced individual glyph features.

    Returns:
    {
        "global": np.ndarray of shape (5,), # added corner_density
        "glyphs": list of np.ndarray explicitly designed from HOG and heuristics
    }
    """
    image = cv2.imread(image_path)

    if image is None:
        raise ValueError(f"Could not read image at path: {image_path}")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Global edge extraction (for stroke width and density metrics)
    edges = cv2.Canny(gray, 50, 150)
    
    # --- Advanced Bounding Box Discovery ---
    # 1. Contrast enhancement via CLAHE to manage uneven lighting
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    
    # 2. Smart Binarization (Otsu) with Polarity Auto-Correction
    _, binarized = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    
    # We must ensure white text on black background for findContours.
    # We check the border pixels. If the border is mostly white, the background is light,
    # so we invert the image.
    border_pixels = np.concatenate([
        binarized[0, :], binarized[-1, :],
        binarized[:, 0], binarized[:, -1]
    ])
    
    if np.mean(border_pixels) > 127:
        thresh_mask = cv2.bitwise_not(binarized)
    else:
        thresh_mask = binarized
    
    # 3. Morphological opening to destroy tiny granular noise
    kernel_clean = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    cleaned = cv2.morphologyEx(thresh_mask, cv2.MORPH_OPEN, kernel_clean, iterations=1)
    
    # We find contours from the highly robust cleaned mask
    contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    densities = []
    aspect_ratios = []
    corner_densities = []
    glyphs = []

    # Initialize HOG descriptor
    hog = cv2.HOGDescriptor((64, 64), (16, 16), (8, 8), (8, 8), 9)

    for c in contours:
        x, y, w, h = cv2.boundingRect(c)

        aspect = w / float(h)
        
        # filter noise: minimum sizes, strict aspect bounds to eliminate lines/borders
        if w > 10 and h > 10 and aspect > 0.1 and aspect < 4.0:
            # --- Global feature extraction ---
            cropped = gray[y:y + h, x:x + w]
            cropped_edges = edges[y:y + h, x:x + w]
            density = np.sum(cropped_edges > 0) / max(cropped_edges.size, 1)
            densities.append(density)
            aspect_ratios.append(aspect)
            
            # --- Advanced Glyph Features ---
            _, local_thresh = cv2.threshold(cropped, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)
            
            # 1. Aspect Ratio
            glyph_aspect = aspect
            
            # 2. Stroke Width (via morphological erosion)
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
            eroded = cv2.erode(local_thresh, kernel, iterations=1)
            glyph_stroke_width = float(np.sum(eroded > 0)) / max(np.sum(local_thresh > 0), 1)
            
            # 3. Serif Detection (via Harris Corners)
            dst = cv2.cornerHarris(np.float32(local_thresh), 2, 3, 0.04)
            corners = np.sum(dst > 0.01 * dst.max()) if dst.max() > 0 else 0
            # Scale corners relative to character area to capture high corner density (serifs)
            corner_density = float(corners) / max((w * h), 1) * 100.0
            corner_densities.append(corner_density)
            
            # 4. HOG (Edge direction histogram, curvature, shape)
            size = max(w, h)
            padded = np.zeros((size, size), dtype=np.uint8)
            x_offset = (size - w) // 2
            y_offset = (size - h) // 2
            padded[y_offset:y_offset+h, x_offset:x_offset+w] = local_thresh
            
            resized = cv2.resize(padded, (64, 64), interpolation=cv2.INTER_AREA)
            
            hog_features = hog.compute(resized).flatten()
            
            # Combine all features. 
            # We add an extremely strict dampening weight to scalar features so their 
            # absolute magnitude doesn't overpower the 1764-dimensional HOG array during L2 Norm.
            custom_features = np.array([
                glyph_aspect * 0.05,
                glyph_stroke_width * 0.05,
                corner_density * 0.001
            ], dtype=np.float32)
            
            combined_vec = np.concatenate((hog_features, custom_features))
            
            # L2 normalize the combined vector for robust Cosine Similarity
            norm = np.linalg.norm(combined_vec)
            if norm > 0:
                combined_vec = combined_vec / norm
                
            glyphs.append(combined_vec)

    if not densities:
        return {
            "global": np.zeros(5, dtype=np.float32),
            "glyphs": []
        }

    # Stroke width feature
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    eroded = cv2.erode(edges, kernel, iterations=1)
    stroke_width_est = float(np.sum(eroded > 0)) / max(np.sum(edges > 0), 1)

    global_features = np.array([
        float(np.mean(densities)),
        float(np.mean(aspect_ratios)),
        float(np.std(aspect_ratios)),
        stroke_width_est,
        float(np.mean(corner_densities)) if corner_densities else 0.0
    ], dtype=np.float32)
    
    return {
        "global": global_features,
        "glyphs": glyphs
    }
