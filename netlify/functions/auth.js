const crypto = require('crypto');

// Store users in environment variables for security
// Format: USERNAME:HASHED_PASSWORD
const USERS = {
  admin: process.env.ADMIN_PASSWORD_HASH || hashPassword('jdr') // Fallback for dev
};

// Generate a secure hash
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate a simple JWT-like token (for demo - use proper JWT lib in production)
function generateToken(username) {
  const payload = {
    username,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  const secret = process.env.JWT_SECRET || 'default-secret-change-me';
  const token = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = crypto.createHmac('sha256', secret).update(token).digest('hex');
  return `${token}.${signature}`;
}

// Verify token
function verifyToken(token) {
  try {
    const [payload, signature] = token.split('.');
    const secret = process.env.JWT_SECRET || 'default-secret-change-me';
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    if (signature !== expectedSignature) {
      return null;
    }

    const data = JSON.parse(Buffer.from(payload, 'base64').toString());

    if (data.exp < Date.now()) {
      return null; // Token expired
    }

    return data;
  } catch (e) {
    return null;
  }
}

exports.handler = async (event) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const { action, username, password, token } = JSON.parse(event.body || '{}');

    // Login action
    if (action === 'login') {
      if (!username || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Username and password required' })
        };
      }

      const hashedPassword = hashPassword(password);

      if (USERS[username] && USERS[username] === hashedPassword) {
        const token = generateToken(username);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            token,
            username
          })
        };
      } else {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid credentials' })
        };
      }
    }

    // Verify action
    if (action === 'verify') {
      if (!token) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Token required' })
        };
      }

      const userData = verifyToken(token);

      if (userData) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            valid: true,
            username: userData.username
          })
        };
      } else {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ valid: false })
        };
      }
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid action' })
    };

  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
