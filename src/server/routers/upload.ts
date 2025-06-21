import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { TRPCError } from '@trpc/server';

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = 'fairsharing';
const PUBLIC_URL = 'https://cdn.fairshar.ing';

export const uploadRouter = router({
  /**
   * Upload image to Cloudflare R2
   */
  uploadImage: publicProcedure
    .input(
      z.object({
        fileName: z.string().min(1),
        fileType: z.string().min(1),
        fileData: z.string().min(1), // base64 encoded file data
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Validate file type
        if (!input.fileType.startsWith('image/')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Only image files are allowed',
          });
        }

        // Extract base64 data (remove data:image/xxx;base64, prefix)
        const base64Data = input.fileData.split(',')[1];
        if (!base64Data) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid file data format',
          });
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, 'base64');

        // Validate file size (5MB max)
        if (buffer.length > 5 * 1024 * 1024) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'File size must be less than 5MB',
          });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = input.fileName.split('.').pop() || 'jpg';
        const uniqueFileName = `uploads/${timestamp}-${randomString}.${fileExtension}`;

        // Upload to R2
        const uploadCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: uniqueFileName,
          Body: buffer,
          ContentType: input.fileType,
          CacheControl: 'public, max-age=31536000', // 1 year cache
        });

        await s3Client.send(uploadCommand);

        // Return public URL
        const publicUrl = `${PUBLIC_URL}/fairsharing/${uniqueFileName}`;

        return {
          success: true,
          url: publicUrl,
          fileName: uniqueFileName,
        };
      } catch (error) {
        console.error('Upload error:', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to upload image',
        });
      }
    }),
});
