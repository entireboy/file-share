var COLLECTION_NAME = 'user';

var mongo = require('./common/mongo');



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
        req.session.message = 'Authentication failed, please check your username and password';
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
  mongo.fetchCollection('user', function(err, collection) {
    collection.findOne({id:id, password:pass}, function(err, cursor) {
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
