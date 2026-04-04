from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from app.services.color_extractor import extract_palette
from app.services.font_detector import detect_font_features
from app.services.font_matcher import match_fonts, get_related_fonts
import shutil
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolve font dataset path relative to this file's location (ai-service/app/main.py)
_DATASET_DIR = os.path.join(os.path.dirname(__file__), "..", "font-dataset")
_DATASET_DIR = os.path.abspath(_DATASET_DIR)

@app.post("/colors")
async def analyze_image(file: UploadFile = File(...)):
    
    file_location = f"temp_{file.filename}"
    
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    palette = extract_palette(file_location, k=5)

    os.remove(file_location)

    return {
        "palette": palette,
    } 

@app.post("/fonts")
async def detect_font(file: UploadFile = File(...)):
    
    file_location = f"temp_{file.filename}"
    
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        query_features = detect_font_features(file_location)
        result = match_fonts(query_features, _DATASET_DIR, top_k=5)
    finally:
        os.remove(file_location)

    return result

@app.get("/fonts/{font_name}/related")
async def get_font_relations(font_name: str):
    related = get_related_fonts(font_name, _DATASET_DIR, top_k=5)
    return related