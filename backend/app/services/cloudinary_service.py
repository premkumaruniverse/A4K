import cloudinary
import cloudinary.uploader
from app.config import settings

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

class CloudinaryService:
    @staticmethod
    def upload_image(file_content, folder="rides"):
        """
        Uploads a file to Cloudinary and returns the secure URL.
        file_content can be a file object, bytes, or a URL.
        """
        try:
            upload_result = cloudinary.uploader.upload(
                file_content,
                folder=folder,
                resource_type="image"
            )
            return upload_result.get("secure_url")
        except Exception as e:
            print(f"Cloudinary upload error: {e}")
            return None

    @staticmethod
    def delete_image(public_id):
        """Deletes an image from Cloudinary."""
        try:
            cloudinary.uploader.destroy(public_id)
            return True
        except Exception as e:
            print(f"Cloudinary delete error: {e}")
            return False
