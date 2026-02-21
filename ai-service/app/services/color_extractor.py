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

    hex_colors = [
        "#{:02x}{:02x}{:02x}".format(c[0], c[1], c[2])
        for c in colors
    ]

    return hex_colors