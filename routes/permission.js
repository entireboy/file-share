var user = require('./user');

/**
 * 파일의 공유 권한 enum
 */
exports.share = {
  PRIVATE: 'PRIVATE'
  , PUBLIC: 'PUBLIC'
};


/**
 * 로그인이 필요한 경우 사용할 middleware
 * 이미 로그인이 되어 있는 경우 callback을 호출하고,
 * 로그인이 되어 있지 않은 경우 로그인 페이지로 전환되고 로그인 후 다시 요청한 URL로 redirect된다.
 * @param {http.ServerRequest} req HTTP request
 * @param {http.ServerResponse} res HTTP response
 * @param {Function} [next] 로그인이 되어 있는 경우 수행할 callback
 */
exports.requireLogin = function(req, res, next) {
  if(req.session.user) {
    next();
  } else {
    req.session.error = 'Login required!';
    res.redirect('/login' + user.login.makeRedirectUrl(req.originalUrl));
  }
};

exports.requireOwn = function(req, res, next) {
console.log('before login check');
  exports.requireLogin(req, res, next);
console.log('after login check');
};
