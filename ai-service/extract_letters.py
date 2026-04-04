import cv2
import os

image = cv2.imread('googleSansTest.jpg')
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
enhanced = clahe.apply(gray)
thresh = cv2.adaptiveThreshold(enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 21, 10)
kernel_clean = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
cleaned = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel_clean, iterations=1)

os.makedirs("debug_crops", exist_ok=True)

# Let's also check Dataset Renders!
from app.services.font_matcher import get_dataset_cache
dataset = get_dataset_cache("font-dataset")
print(f"Dataset keys count: {len(dataset.keys())}")
# Print the vector magnitude of Akronim-Regular's first glyph
if "Akronim-Regular" in dataset:
    vec = dataset["Akronim-Regular"]["glyphs"][0]
    print(f"Akronim Vector Length: {len(vec)}, Sum: {sum(vec):.2f}, Max: {max(vec):.2f}, Min: {min(vec):.2f}")

idx = 0
contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
for c in contours:
    x, y, w, h = cv2.boundingRect(c)
    aspect = w / float(h)
    if w > 10 and h > 10 and aspect > 0.1 and aspect < 4.0:
        crop = cleaned[y:y+h, x:x+w]
        cv2.imwrite(f"debug_crops/crop_{idx}.png", crop)
        # Check if the crop is completely solid
        mean_val = cv2.mean(crop)[0]
        print(f"Crop {idx}: Mean Pixel Intensity: {mean_val:.2f} (0=Black, 255=White)")
        idx += 1
