import os

# Fallback Neon URL – replace with your own if env var is not set
NEON_URL_FALLBACK = "postgresql://neondb_owner:npg_Lx1ckHp3KuSG@ep-small-night-bd3bycxe-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
import csv
import json
import urllib.request
import psycopg2
import psycopg2.extras
from io import StringIO

# === Configuration ===
# Replace this URL with the direct ATF CSV download link when you have it.
ATF_CSV_URL = "file:///c:/Users/colem/Downloads/1026-ffl-list.csv"  # user-provided CSV

# Path to the ZIP code latitude/longitude JSON generated earlier.
ZIP_LATLON_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'netlify', 'functions', 'zip_latlon.json'))

# Load ZIP code map.
with open(ZIP_LATLON_PATH, 'r', encoding='utf-8') as f:
    ZIP_MAP = json.load(f)

# Helper to enrich a row with latitude/longitude based on ZIP.
def enrich_row(row: dict) -> dict:
    # Look for a ZIP code in any of the possible column names
    zip_code = (
        row.get('ZIP_CODE')
        or row.get('ZIP')
        or row.get('ZIPCODE')
        or row.get('PREMISE_ZIP_CODE')
    )
    if zip_code:
        zip_code = zip_code.zfill(5)
        latlon = ZIP_MAP.get(zip_code)
        if latlon:
            row['latitude'] = latlon['latitude']
            row['longitude'] = latlon['longitude']
    return row

# Download the ATF CSV.
def download_atf_csv(url: str) -> str:
    # Support local file URLs (file://) as well as HTTP URLs
    if url.lower().startswith('file://'):
        # Strip scheme
        local_path = url[7:]
        # On Windows, the path may start with a leading slash like '/c:/...'
        if os.name == 'nt' and local_path.startswith('/'):
            local_path = local_path.lstrip('/')
        # Normalize the path
        local_path = os.path.normpath(local_path)
        with open(local_path, 'r', encoding='utf-8') as f:
            return f.read()
    else:
        with urllib.request.urlopen(url) as resp:
            return resp.read().decode('utf-8')

# Parse CSV text into a list of dicts.
def parse_csv(csv_text: str) -> list:
    reader = csv.DictReader(StringIO(csv_text))
    rows = []
    for r in reader:
        rows.append(enrich_row(r))
    return rows

# Bulk‑load rows into Neon PostgreSQL.
def load_into_neon(rows: list):
    db_url = os.getenv('NEON_DATABASE_URL', NEON_URL_FALLBACK)
    if not db_url:
        raise RuntimeError('NEON_DATABASE_URL environment variable not set')
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    # Ensure table exists.
    cur.execute('''
        CREATE TABLE IF NOT EXISTS ffl_dealers (
            id SERIAL PRIMARY KEY,
            lic_regn VARCHAR(3),
            lic_disn VARCHAR(5),
            business_name VARCHAR(255),
            premise_street VARCHAR(255),
            premise_city VARCHAR(100),
            premise_state VARCHAR(2),
            premise_zip VARCHAR(10),
            latitude NUMERIC(10,6),
            longitude NUMERIC(10,6)
        );
    ''')
    # Prepare COPY data.
    buffer = StringIO()
    writer = csv.writer(buffer, delimiter='\t', quoting=csv.QUOTE_MINIMAL)
    for r in rows:
        writer.writerow([
            r.get('LIC_REGN'),
            r.get('LIC_DISN'),
            r.get('BUSINESS_NAME') or r.get('BUSINESSNAME'),
            r.get('STREET') or r.get('PREMISE_STREET'),
            r.get('CITY') or r.get('PREMISE_CITY'),
            r.get('STATE') or r.get('PREMISE_STATE'),
            r.get('ZIP_CODE') or r.get('ZIP'),
            r.get('latitude') if r.get('latitude') is not None else '\\N',
            r.get('longitude') if r.get('longitude') is not None else '\\N'
        ])
    buffer.seek(0)
    cur.copy_from(buffer, 'ffl_dealers', columns=(
        'lic_regn', 'lic_disn', 'business_name', 'premise_street',
        'premise_city', 'premise_state', 'premise_zip', 'latitude', 'longitude'
    ), sep='\t')
    conn.commit()
    cur.close()
    conn.close()
    print(f'Inserted {len(rows)} rows into ffl_dealers')

def main():
    print('Downloading ATF CSV...')
    csv_text = download_atf_csv(ATF_CSV_URL)
    print('Parsing CSV...')
    rows = parse_csv(csv_text)
    # Filter out rows without latitude/longitude (required for numeric columns)
    rows = [r for r in rows if r.get('latitude') is not None and r.get('longitude') is not None]
    print(f'Loading {len(rows)} rows into Neon...')
    load_into_neon(rows)
    print('Done.')

if __name__ == '__main__':
    main()
