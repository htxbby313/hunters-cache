import os
import zipfile

src_dir = r"C:\\Users\\colem\\.gemini\\antigravity\\scratch\\hunters-cache-ffl"
zip_path = r"C:\\Users\\colem\\.gemini\\brain\\bd1382ac-37cf-4b87-a31a-8bf1ee07fc3a\\hunters-cache-full.zip"

with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(src_dir):
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, src_dir)
            zf.write(full_path, rel_path)
print(f"Created zip at {zip_path}")
