import Logger from 'js-logger';

function get(req, res) {
  if(req.session.user) Logger.info('Logging out', req.session.user.patreonId);

  req.session = null;
  res.writeHead(301, { Location: '/', 'Cache-Control': 'no-store' });
  res.end();
}

export {
  get
}