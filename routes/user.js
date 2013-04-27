var USER_COLLECTION = 'user';

var mongo = require('./common/mongo');
var error = require('./common/error');
var file = require('./file');
var CONFIG = require('config');


// ================================================
// user
// ================================================
/**
 * 사용자 정보 페이지
 * 다음과 같은 정보가 포함된다:
 *   - 사용자 일반 정보
 *   - 사용자의 파일
 *      + 소유한 파일 (own)
 *      + 수정 가능 파일 (edit)
 *      + 사용/다운로드 가능 파일 (view)
 * @param {http.ServerRequest} req HTTP request
 *   {String} req.params.userId 사용자 ID
 * @param {http.ServerResponse} res HTTP response
 */
exports.info = function(req, res) {
  var userId = req.params.userId;
  var result = {};
  
  // retrieve user info
  mongo.fetchCollection(USER_COLLECTION, function(err, collection) {
    collection.findOne({_id: userId}, function(err, user) {
      if(err || null === user) {
        res.json(error.CANNOT_FIND_USER_INFO);
        return;
      }
      result.title = user._id + '(' + user.name + ')';
      result.user = {};
      result.user.id = user._id;
      result.user.name = user.name;
      result.file = {};
      result.file.listSize = CONFIG.server.file.listSize.userInfo;
      result.file.owns = [];
      result.file.edits = [];
      result.file.views = [];

      // 사용자가 권한을 가지고 있는 파일 목록을 구해서 반환한다.
      file.list.ofUser(req, res, result);
    });
  });
};

exports.signup = {};

/**
 * 회원가입 페이지
 * @param {http.ServerRequest} req HTTP request
 * @param {http.ServerResponse} res HTTP response
 */
exports.signup.page = function(req, res) {
  res.render('user/signup', {title: 'Sign up'});
};

exports.signup.signup = function(req, res) {

};

// ================================================
// login
// ================================================
exports.login = {};

/**
 * 로그인 페이지
 * @param {http.ServerRequest} req HTTP request
 *   {String} [req.params.url] 로그인 성공 후 redirect할 URL (optional)
 * @param {http.ServerResponse} res HTTP response
 */
exports.login.page = function(req, res) {
  var redirectUrl = req.query.url || '';
  res.render('user/login', {title: 'Login', redirectUrl: redirectUrl});
};

exports.login.login = function(req, res) {
  authenticate(req.body.user.id, req.body.user.pass, function(err, user) {
    if(user) {
      req.session.regenerate(function() {
        req.session.user = user;
        req.session.message = 'Authenticated as ' + user.name;
        
        if(req.body.url) res.redirect(req.body.url);
        else res.redirect('/');
      });
    } else {
        req.session.message = error.AUTHENTICATION_FAIL.dmessage;
        res.redirect('login' + makeRedirectUrl(req.body.url));
    }
  });
};

exports.login.logout = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/');
  });
};

/**
 * (로그인한 다음 등의 상황에서) redirect할 url의 경로를 반환한다.
 * (redirect URL 표준화용도)
 * @param {String} redirectUrl redirect할 url
 * @rerurn {String} 표준화된 redirect URL
 * @author entireboy
 */
var makeRedirectUrl = exports.login.makeRedirectUrl = function(redirectUrl) {
  if(!redirectUrl || '' === redirectUrl) return '';
  else return '?url=' + redirectUrl;
};

/**
 * 로그인 인증을 수행한다.
 * @param {String} id ID
 * @param {String} pass password
 * @param {Function} callback 인증 후 호출할 callback
 *   {Error} error 에러 발생 시 에러
 *   {Json} [user] 인증 성공한 사용자 정보
 */
var authenticate = function (id, pass, callback) {
  mongo.fetchCollection(USER_COLLECTION, function(err, collection) {
    collection.findOne({_id: id, password: pass}, function(err, cursor) {
      if(err) callback(err);
      
      if(cursor) {
        callback(null, {
          id: cursor._id
          , name: cursor.name
        });
      } else {
        callback(new Error('Cannot find user'));
      }
    });
  });
}
