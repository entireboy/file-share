
/**
 * Module dependencies.
 */

require('./routes/common/common.js');
var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , CONFIG = require('config')
  , mongodb = require('mongodb')
  , mongoStore = require('connect-mongodb')
  , permission = require('./routes/permission');

var app = express();


// MongoDB connection
var mongoServer = new mongodb.Server(
  CONFIG.mongodb.host, CONFIG.mongodb.port,
  {auto_reconnect:CONFIG.mongodb.autoReconnect, poolSize:CONFIG.mongodb.pollSize});
module.db = {};
module.db.ObjectID = mongodb.ObjectID;
module.db.fileShare = new mongodb.Db(CONFIG.mongodb.database, mongoServer, {safe:false});

// HTTP server setting
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));

  // 파일 업로드는 bodyParser 대신 formidable을 직접 사용
  app.use(express.json());
  app.use(express.urlencoded());

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

  // 항상 로그인한 정보를 넣어준다. - router 보다 앞에 넣어주어야 함
  app.use(whoami);
  app.use(app.router);
  app.use(require('less-middleware')({
    src: __dirname + '/src/less'
    , dest: __dirname + '/var/css'
    , prefix: '/css'
  }));


  // 손수 만든 코드를 넣는다 - 이미지 등
  app.use(express.static(path.join(__dirname, 'public')));
  // less나 uglify 등으로 자동으로 생성되는 내용 - 폴더를 다 지워도 새로 생성될 수 있는 것들만 넣는다
  app.use(express.static(path.join(__dirname, 'var')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});



// Route setting
app.get('/', routes.index);

app.get('/signup', routes.user.signup.page);
app.post('/signup', routes.user.signup.signup);

app.get('/login', routes.user.login.page);
app.post('/login', routes.user.login.login);
app.all('/logout', routes.user.login.logout);

app.get('/owns.:format?', routes.file.list.ofUser.owns);
app.get('/edits.:format?', routes.file.list.ofUser.edits);
app.get('/views.:format?', routes.file.list.ofUser.views);

app.get('/user/:userId', routes.user.info);
app.get('/user/:userId/file/owns.:format?', routes.file.list.ofUser.owns);
app.get('/user/:userId/file/edits.:format?', routes.file.list.ofUser.edits);
app.get('/user/:userId/file/views.:format?', routes.file.list.ofUser.views);

app.get('/file/upload', permission.requireLogin, routes.file.upload.page);
app.post('/file/upload', permission.requireLogin, routes.file.upload.upload);
app.get('/file/:fileId', routes.file.download);
app.get('/file/:fileId/info.:format?', permission.requireLogin, routes.file.info);
app.get('/file/:fileId/share', permission.requireLogin, routes.file.share);




// for test
app.configure('development', function() {
  app.get('/restricted', permission.requireLogin, function(req, res) {
    res.send('<p>restricted area</p><p><a href="/logout">logout</a>');
  });
});





// Middleware

/**
 * 로그인한 사용자 정보를 rendering에 사용할 수 있게 항상 넣어주는 middleware
 * @param {http.ServerRequest} req HTTP request
 * @param {http.ServerResponse} res HTTP response
 * @param {callback} next
 */
function whoami(req, res, next) {
  if(req.session.user) res.locals.whoami = req.session.user;
  else res.locals.whoami = undefined;
  res.locals.loginUrl = '/login' + routes.user.login.makeRedirectUrl(req.originalUrl);
  next();
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
