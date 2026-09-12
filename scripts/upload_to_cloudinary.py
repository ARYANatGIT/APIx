import os
import sys
import json
import urllib.request
import urllib.parse
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
IMAGE_PATH = ROOT_DIR / "frontend" / "my-react-app" / "src" / "assets" / "airsetu_logo.png"

CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
UPLOAD_PRESET = os.getenv("CLOUDINARY_UPLOAD_PRESET")
API_KEY = os.getenv("CLOUDINARY_API_KEY")
API_SECRET = os.getenv("CLOUDINARY_API_SECRET")


def upload_to_cloudinary():
    print("=" * 70)
    print(" AirSetu: Cloudinary Image Deployment Utility")
    print("=" * 70)

    if not IMAGE_PATH.exists():
        print(f"[ERROR] Source image not found at: {IMAGE_PATH}")
        sys.exit(1)

    print(f"Source Image : {IMAGE_PATH}")
    print(f"Image Size   : {IMAGE_PATH.stat().st_size:,} bytes")

    if not CLOUD_NAME:
        print("\n[NOTE] Cloudinary requires a registered Cloud Name to host images.")
        print("To deploy to your Cloudinary account, please provide:")
        print("  - CLOUDINARY_CLOUD_NAME (in .env or environment)")
        print("  - CLOUDINARY_UPLOAD_PRESET (unsigned) OR CLOUDINARY_API_KEY & SECRET (signed)\n")
        print("Example .env entries:")
        print("  CLOUDINARY_CLOUD_NAME=my_airsetu_cloud")
        print("  CLOUDINARY_UPLOAD_PRESET=airsetu_preset")
        print("=" * 70)
        return False

    upload_url = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload"
    print(f"Target URL   : {upload_url}")

    with open(IMAGE_PATH, "rb") as f:
        img_bytes = f.read()

    # Form boundary
    boundary = "----AirSetuCloudinaryBoundary"
    body = bytearray()

    if UPLOAD_PRESET:
        # Unsigned upload
        body.extend(f"--{boundary}\r\n".encode())
        body.extend(b'Content-Disposition: form-data; name="upload_preset"\r\n\r\n')
        body.extend(UPLOAD_PRESET.encode() + b"\r\n")

    body.extend(f"--{boundary}\r\n".encode())
    body.extend(b'Content-Disposition: form-data; name="public_id"\r\n\r\n')
    body.extend(b"airsetu_official_logo\r\n")

    body.extend(f"--{boundary}\r\n".encode())
    body.extend(b'Content-Disposition: form-data; name="file"; filename="airsetu_logo.png"\r\n')
    body.extend(b"Content-Type: image/png\r\n\r\n")
    body.extend(img_bytes)
    body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode())

    req = urllib.request.Request(
        upload_url,
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )

    try:
        print("\nUploading to Cloudinary CDN...")
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            secure_url = data.get("secure_url")
            print(f"[SUCCESS] Successfully deployed to Cloudinary!")
            print(f"Retrieval URL: {secure_url}")
            print("\nTo use this URL in the frontend, add to frontend/my-react-app/.env:")
            print(f"  VITE_CLOUDINARY_LOGO_URL={secure_url}")
            return True
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode()
        print(f"[ERROR] Cloudinary HTTP Error {e.code}: {err_msg}")
        return False
    except Exception as e:
        print(f"[ERROR] Upload failed: {e}")
        return False


if __name__ == "__main__":
    upload_to_cloudinary()

