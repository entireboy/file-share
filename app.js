
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , CONFIG = require('config')
  , mongodb = require('mongodb')
  , mongoStore = require('connect-mongodb');

var app = express();


// MongoDB connection
var mongoServer = new mongodb.Server(
  CONFIG.mongodb.host, CONFIG.mongodb.port,
  {auto_reconnect:CONFIG.mongodb.autoReconnect, poolSize:CONFIG.mongodb.pollSize});
module.db = {};
module.db.fileShare = new mongodb.Db(CONFIG.mongodb.database, mongoServer, {safe:false});

// HTTP server setting
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser(CONFIG.secure.cookie.secret));
  app.use(express.session({
    cookie: {maxAge: CONFIG.secure.cookie.maxAge}
    , secret: CONFIG.secure.session.secret
    , store: new mongoStore({db:module.db.fileShare}, function(err) {
      if(err) {
        // Shutdown when MongoDB is not ready
        process.kill(process.pid, 'SIGTERM');
        console.log(err);
      }
      console.log('Session storage is ready');
    })
  }));
    
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});



// Route setting
app.get('/', routes.index);

app.get('/login', routes.user.login.page);
app.post('/login', routes.user.login.login);
app.all('/logout', routes.user.login.logout);

app.get('/user/:userId', routes.user.info);
//app.get('/users', routes.user.list);

app.get('/file/:fileId', checkPermission, routes.file.download);
app.get('/file/info/:fileId', checkPermission, routes.file.info);




// for test
app.configure('development', function() {
  app.get('/restricted', checkPermission, function(req, res) {
    res.send('<p>restricted area</p><p><a href="/logout">logout</a>');
  });
});





// Middleware
function checkPermission(req, res, next) {
  if(req.session.user) {
//  TODO
//  파일 권한 체크 후 next()
    next();
  } else {
    req.session.error = 'Login required!';
    res.redirect('/login' + routes.user.login.makeRedirectUrl(req.originalUrl));
  }
}

var httpServer = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

// Graceful shutdown
process.on('SIGTERM', function() {
    console.log('Server is closing');
    module.db.fileShare.close();
    httpServer.close();
    console.log('Server is closed');
});
