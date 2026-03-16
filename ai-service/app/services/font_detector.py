import cv2
import numpy as np


def detect_font_features(image_path: str) -> np.ndarray:
    """
    Extract a 4-element feature vector from an image for font similarity matching.

    Features:
      [0] mean_edge_density    — average edge pixel density across text regions
      [1] mean_aspect_ratio    — mean width/height ratio of text bounding boxes
      [2] std_aspect_ratio     — std dev of aspect ratios (captures regularity)
      [3] stroke_width_est     — thin vs. thick stroke proxy via erosion residual

    Returns a zero vector when no valid text regions are found.
    """
    image = cv2.imread(image_path)

    if image is None:
        raise ValueError(f"Could not read image at path: {image_path}")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    densities = []
    aspect_ratios = []

    for c in contours:
        x, y, w, h = cv2.boundingRect(c)

        if w > 50 and h > 20:  # filter noise
            cropped = gray[y:y + h, x:x + w]
            cropped_edges = cv2.Canny(cropped, 50, 150)
            density = np.sum(cropped_edges > 0) / cropped_edges.size
            densities.append(density)
            aspect_ratios.append(w / h)

    if not densities:
        return np.zeros(4, dtype=np.float32)

    # Stroke width: ratio of pixels surviving a morphological erosion
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    eroded = cv2.erode(edges, kernel, iterations=1)
    stroke_width_est = float(np.sum(eroded > 0)) / max(np.sum(edges > 0), 1)

    return np.array([
        float(np.mean(densities)),
        float(np.mean(aspect_ratios)),
        float(np.std(aspect_ratios)),
        stroke_width_est,
    ], dtype=np.float32)
