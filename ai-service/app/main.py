# ai-service/app/main.py

from services.color_extractor import extract_palette

if __name__ == "__main__":
    palette = extract_palette("sample.jpg", k=5)
    print("Extracted palette:", palette)