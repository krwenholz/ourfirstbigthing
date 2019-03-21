import Logger from 'js-logger';
import config from 'config';

function protectNonDefaultRoutes(req, res, next) {

  const allowedAbsolutes = [
    '/',
    '/about',
    '/auth/fake_login',
    '/auth/logout',
    '/auth/initiate_login',
    '/index',
    '/login',
    '/service-worker.js',
    '/story.json',
  ];

  const allowedPrefixes = [
    '/auth/login',
    '/client',
    '/favicon'
  ];

  const isProtected = allowedAbsolutes.indexOf(req.url) == -1
    && !allowedPrefixes.some((prefix) => req.url.startsWith(prefix));

  if( isProtected && !req.session.user ) {
    Logger.info('Unauthenticated access found on url: ', req.url);
    res.writeHead(401);
    res.end();
    return;
  }

  next();
}

/*
 * Redirect to https.
 */
function requireHTTPS(req, res, next) {
  // The 'x-forwarded-proto' check is for Heroku
  if (req.headers['x-forwarded-proto'] !== 'https' && req.protocol !== 'https' && !req.headers['host'].startsWith('127.0.0.1') && !config.get('dev')) {
    const url = 'https://' + req.headers['host'] + req.url;
    res.writeHead(302, { Location: url });
    return res.end();
  }
  next();
}

export {
  protectNonDefaultRoutes,
  requireHTTPS
}