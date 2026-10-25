import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary SDK with environment credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dnt3plbap',
  api_key: process.env.CLOUDINARY_API_KEY || '155294123714548',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'oT5ltO_B_ojSqMuBt3ERr3OaGa8',
});

// Configure Multer Storage Engine for Cloudinary
export const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'suffex-ecommerce/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
    ],
  },
});

export { cloudinary };
export default cloudinary;
