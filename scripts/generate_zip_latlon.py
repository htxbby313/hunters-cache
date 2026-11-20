import json
import csv
import os

# Paths
US_TXT = os.path.join(os.path.dirname(__file__), 'us_zip', 'US.txt')
OUTPUT_JSON = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'netlify', 'functions', 'zip_latlon.json'))

zip_map = {}
with open(US_TXT, newline='', encoding='utf-8') as f:
    reader = csv.reader(f, delimiter='\t')
    for row in reader:
        if len(row) < 11:
            continue
        zip_code = row[1].zfill(5)  # ensure 5 digits
        try:
            latitude = float(row[9])
            longitude = float(row[10])
        except ValueError:
            continue
        zip_map[zip_code] = {"latitude": latitude, "longitude": longitude}

# Ensure output directory exists
os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
with open(OUTPUT_JSON, 'w', encoding='utf-8') as out_f:
    json.dump(zip_map, out_f, indent=2)
print(f"Generated {len(zip_map)} ZIP entries to {OUTPUT_JSON}")
