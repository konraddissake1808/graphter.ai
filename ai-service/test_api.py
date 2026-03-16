import requests
import json

url = "http://127.0.0.1:8000/fonts"
files = {'file': open('fontSample.jpg', 'rb')}

try:
    response = requests.post(url, files=files)
    print(f"Status: {response.status_code}")
    print("Response JSON:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
