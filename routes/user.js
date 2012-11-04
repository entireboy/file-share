var DEFAULT_COLLECTION_NAME = 'user';



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

/**
 * Fetch the MongoDB collection
 * 
 * @param {String} [collecitonName] colleciton name to fetch. If does not specified, #DEFAULT_COLLECTION_NAME will be used.
 * @param {Function} callback returns fetched MongoDB colleciton
 */
function fetchCollection(collectionName, callback) {
  if('function' === typeof(collectionName)) callback = collectionName, collectionName = DEFAULT_COLLECTION_NAME;
  if(null === collectionName) collectionName = DEFAULT_COLLECTION_NAME;
  
  require.main.db.fileShare.collection(collectionName, function(err, collection) {
    if(err) callback(err, null);
    else callback(null, collection);
  });
}

function authenticate(id, pass, callback) {
  fetchCollection(function(err, collection) {
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
