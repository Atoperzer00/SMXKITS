const jwt = require('jsonwebtoken');

module.exports = (roles = []) => (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.sendStatus(401);
  
  const token = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      console.error('❌ JWT verification error:', err.message);
      return res.sendStatus(403);
    }
    if (roles.length && !roles.includes(user.role)) {
      console.log('❌ Role access denied. Required:', roles, 'User role:', user.role);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};