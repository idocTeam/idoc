/**
 * Placeholder middleware for future JWT-based authentication
 * In a real-world scenario, this would verify a token from the auth-service
 */
export const authMiddlewarePlaceholder = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Mock user info if Authorization header is present
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      
      // We'll store the token for later use when calling Patient Service
      req.token = authHeader;
      
      // For now, we'll still use the mock user id but we can also store the token info
      console.log(`Auth header detected. Token found (length: ${token ? token.length : 0})`);
      
      // Attaching mock user info for downstream use
      // In a real scenario, we might decode the token here
      req.user = {
        id: 'mock-user-id',
        role: 'patient',
        authenticated: true,
        token: authHeader
      };
    } catch (error) {
      console.error('Auth placeholder error:', error.message);
      req.user = {
        id: 'anonymous',
        role: 'guest',
        authenticated: false
      };
    }
  } else {
    req.user = {
      id: 'anonymous',
      role: 'guest',
      authenticated: false
    };
  }

  next();
};
