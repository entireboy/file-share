var USER_COLLECTION = 'user';

var mongo = require('./common/mongo');
var error = require('./common/error');
var file = require('./file');
var CONFIG = require('config');


// ================================================
// user
// ================================================
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

// ================================================
// login
// ================================================
exports.login = {};

exports.login.page = function(req, res) {
  var redirectUrl = req.query.url || '';
  res.render('login', {title: 'Login', redirectUrl: redirectUrl});
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

var makeRedirectUrl = exports.login.makeRedirectUrl = function(redirectUrl) {
  if(!redirectUrl || '' === redirectUrl) return '';
  else return '?url=' + redirectUrl;
};


var authenticate = function (id, pass, callback) {
  mongo.fetchCollection(USER_COLLECTION, function(err, collection) {
    collection.findOne({_id: id, password: pass}, function(err, cursor) {
      if(err) return callback(err);
      
      if(cursor) {
        return callback(null, {
          id: cursor._id
          , name: cursor.name
        });
      } else {
        return callback(new Error('Cannot find user'));
      }
    });
  });
}
