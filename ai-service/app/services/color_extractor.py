# ai-service/app/services/color_extractor.py

import cv2
import numpy as np
from sklearn.cluster import KMeans

def extract_palette(image_path: str, k: int = 5):
    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    pixels = image.reshape((-1, 3))

    kmeans = KMeans(n_clusters=k, n_init=10)
    kmeans.fit(pixels)

    colors = kmeans.cluster_centers_.astype(int)

    from collections import Counter
    counts = Counter(kmeans.labels_)
    total_pixels = len(pixels)

    palette_data = []
    for i, c in enumerate(colors):
        hex_color = "#{:02x}{:02x}{:02x}".format(c[0], c[1], c[2])
        percentage = (counts[i] / total_pixels) * 100
        palette_data.append({
            "color": hex_color,
            "percentage": round(percentage, 2)
        })

    # Sort by percentage descending so dominant is first
    palette_data.sort(key=lambda x: x["percentage"], reverse=True)

    return palette_data