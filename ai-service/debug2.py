import cv2

image = cv2.imread('googleSansTest.jpg')
print(f"Image Size: {image.shape}")

gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
enhanced = clahe.apply(gray)
thresh = cv2.adaptiveThreshold(enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 21, 10)
kernel_clean = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
cleaned = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel_clean, iterations=1)
contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

boxes = []
for c in contours:
    x, y, w, h = cv2.boundingRect(c)
    aspect = w / float(h)
    if w > 10 and h > 10 and aspect > 0.1 and aspect < 4.0:
        boxes.append((w, h))
        
print(f"Total valid contours: {len(boxes)}")
print(f"Widths/Heights: {boxes}")
