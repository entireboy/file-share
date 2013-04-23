var user = require('./user');

/**
 * 파일의 공유 권한 enum
 */
exports.share = {
  PRIVATE: 'PRIVATE'
  , PUBLIC: 'PUBLIC'
};


exports.requireLogin = function(req, res, next) {
  if(req.session.user) {
    next();
  } else {
    req.session.error = 'Login required!';
    res.redirect('/login' + user.login.makeRedirectUrl(req.originalUrl));
  }
};
