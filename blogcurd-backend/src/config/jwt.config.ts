export const jwtConfig = {
  secret: 'dev-secret-key', // 硬编码密钥,保证与JWT验证使用的完全一致
  signOptions: {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
}; 
 