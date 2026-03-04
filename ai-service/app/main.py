from fastapi import FastAPI, UploadFile, File
from app.services.color_extractor import extract_palette
import shutil
import os

app = FastAPI()

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    
    file_location = f"temp_{file.filename}"
    
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    palette = extract_palette(file_location, k=5)

    os.remove(file_location)

    return {
        "palette": palette
    } 