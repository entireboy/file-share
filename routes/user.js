var COLLECTION_NAME = 'user';

var mongo = require('./common/mongo');
var error = require('./common/error');



// ================================================
// user
// ================================================
exports.info = function(req, res) {
  var userId = req.params.userId;
  var result = {};
  
  mongo.fetchCollection(COLLECTION_NAME, function(err, collection) {
    collection.findOne({id: userId}, function(err, user) {
      if(err || null === user) {
        res.json(error.CANNOT_FIND_USER_INFO);
        return;
      }
      result.title = user.id + '(' + user.name + ')';
      result.user = {};
      result.user.id = user.id;
      result.user.name = user.name;
      result.file = {};
      // TODO fetch file info
      // own + shared(editable) + shared(viewable)
      result.file.own = [];
      result.file.edit = [];
      result.file.view = [];
      
      res.render('userInfo', result);
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
        res.redirect('login');
    }
  });
};

exports.login.logout = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/');
  });
};


function authenticate(id, pass, callback) {
  mongo.fetchCollection(COLLECTION_NAME, function(err, collection) {
    collection.findOne({id: id, password: pass}, function(err, cursor) {
      if(err) return callback(err);
      
      if(cursor) {
        return callback(null, {
          id: cursor.id
          , name: cursor.name
        });
      } else {
        return callback(new Error('Cannot find user'));
      }
    });
  });
}
