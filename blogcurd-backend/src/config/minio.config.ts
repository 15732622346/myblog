export const minioConfig = {
  endPoint: process.env.MINIO_ENDPOINT || '192.168.253.128',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true' || false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  bucketName: process.env.MINIO_BUCKET_NAME || 'blog-images',
  publicEndpoint: process.env.MINIO_PUBLIC_ENDPOINT || 
    (process.env.NODE_ENV === 'production' 
      ? 'http://192.168.253.128:9000'  
      : 'http://192.168.253.128:9000')
}; 