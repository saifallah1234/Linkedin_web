const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const verifyGoogleToken = async (idToken) => {
  try {
    console.log('Verifying Google token...');
    
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    console.log('Google token verified for:', payload.email);
    
    return {
      googleId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified,
      firstName: payload.given_name || 'Google',
      lastName: payload.family_name || 'User',
      picture: payload.picture || '',
      locale: payload.locale || 'en'
    };
    
  } catch (error) {
    console.error('Google token verification failed:', error.message);
    throw new Error('Invalid Google token');
  }
};

module.exports = { verifyGoogleToken };