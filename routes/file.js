var FILE_COLLECTION = 'file';

var dateFormat = require('./common/dateFormat');
var mongo = require('./common/mongo');
var fs = require('fs');
var error = require('./common/error');
var CONFIG = require('config');
var permission  = require('./permission');



/**
 * 요청한 파일(req.params.fileId)을 다운로드한다. 파일의 공유 설정과 접근 권한에 따라 로그인이 필요하거나 다운로드가 불가능할 수 있다.
 * @param {http.ServerRequest} req HTTP request
 *   {String} req.params.userId 사용자 ID
 * @param {http.ServerResponse} res HTTP response
 * @author entireboy
 */
exports.download = function(req, res) {
  var fileId = req.params.fileId;
  mongo.fetchCollection(FILE_COLLECTION, function(err, collection) {
    collection.findOne({_id: fileId}, function(err, doc) {
      if(err || null === doc) {
        res.json(error.CANNOT_FIND_FILE_INFO);
        return;
      }
      
      var filePath = CONFIG.server.file.upload.path + doc.file.path;
      if(fs.existsSync(filePath)) {
        console.log('download - fileId: ' + fileId + '(' + CONFIG.server.file.upload.path + doc.file.path + ', ' + doc.share + '), user: ' + JSON.stringify(req.session.user));
        if(permission.share.PUBLIC !== doc.share)
          permission.requireLogin(req, res, function() {
            res.download(filePath);
          });
        else
          res.download(filePath);
      } else {
        console.log('download fail (cannot find file in disk) - fileId: ' + fileId + '(' + CONFIG.server.file.upload.path + doc.file.path + ', ' + doc.share + '), user: ' + JSON.stringify(req.session.user));
        res.json(error.CANNOT_FIND_FILE);
        return;
      }
    });
  });
};

/**
 * 요청한 파일(req.params.fileId)의 정보를 조회한다. 파일의 공유 권한에 따라 로그인이 필요할 수 있다.
 * @param {http.ServerRequest} req HTTP request
 *   {String} req.params.userId 사용자 ID
 * @param {http.ServerResponse} res HTTP response
 * @author entireboy
 */
exports.info = function(req, res) {
  var fileId = req.params.fileId;
  mongo.fetchCollection(FILE_COLLECTION, function(err, collection) {
    collection.findOne({_id: fileId}, function(err, doc) {
      if(err || null === doc) {
        res.json(error.CANNOT_FIND_FILE_INFO);
        return;
      }
      
      var result = {};
      result.file = {};
      result.file.name = doc.file.name;
      result.file.uploaded = dateFormat.toDateTime(doc.file.time);
      result.user = {};
      result.user.owner = doc.user.own;
      result.user.editors = doc.user.edits;
      result.user.viewers = doc.user.views;
      result.now = dateFormat.toDateTime(new Date());
      res.json(result);
    });
  });
};

exports.list = {};

/**
 * 사용자가 권한을 가지고 있는 모든 종류의 파일을 일부만 가져온다. (종류: own, editable, viewable, ...)
 * @param {http.ServerRequest} req HTTP request
 * @param {http.ServerResponse} res HTTP response
 * @param {Json} result 화면에 돌려줄 결과, 사용자 아이디가 result.user.id의 값으로 반드시 존재해야 함
 *   {Json} result.file 각 종류별 사용자 파일을 담을 배열 map
 *   {String} result.user.id 사용자 ID
 * @author entireboy
 */
exports.list.ofUser = function(req, res, result) {
  mongo.fetchCollection(FILE_COLLECTION, function(err, collection) {
    var totalFileTypeCount = 3; // owns, edits, views
    var retrievedFileTypeCount = 0;
    var retrieveFiles = function(opts) {
      collection.find(opts.query).limit(CONFIG.server.file.listSize.userInfo + 1).sort({'file.time':-1}).toArray(function(err, docs) {
        if(err || null === docs) {
          res.json(error.CANNOT_FIND_FILE_INFO);
          return;
        }
        docs.forEach(function(doc, i) {
          result.file[opts.fileType].push({
            id: doc._id
            , name: doc.file.name
            , uploaded: dateFormat.toDateTime(doc.file.time)
          });
        });
        retrievedFileTypeCount++;

        // 파일을 모두 구해오면 화면에 돌려준다.
        if(retrievedFileTypeCount == totalFileTypeCount) res.render('userInfo', result);
      });
    };

    // 사용자의 파일을 구해온다. (async)
    // 1. retrieve own files
    retrieveFiles({fileType: 'owns', query: {'user.own': result.user.id}});
    // 2. retrieve editable files
    retrieveFiles({fileType: 'edits', query: {'user.edits': result.user.id}});
    // 3. retrieve viewable files
    retrieveFiles({fileType: 'views', query: {'user.views': result.user.id}});
  });
};

/**
 * 사용자가 소유한 파일을 조회한다. (페이징처리 포함)
 * @param {http.ServerRequest} req HTTP request
 *   {String} [req.params.userId] 사용자 ID (optional - 주어지지 않는 경우 로그인한 사용자)
 *   {Number} req.query.lastId 이전에 조회된 마지막 파일 ID (이 ID 다음의 파일을 페이지 크기 만큼 조회한다)
 * @param {http.ServerResponse} res HTTP response
 * @author entireboy
 */
exports.list.ofUser.owns = function(req, res) {
  var userId = req.params.userId;
  if(!userId) {
    permission.requireLogin(req, res, function() {
      userId = req.session.user.id;
    });
  }

  var opts = {
    query: {
      'user.own': userId
    }
  };
  if(req.query.lastId) {
    opts.query['file.time'] = {'$lt': new Date(Number(req.query.lastId))}
  }
  retrieveFilesOfUser(opts, function(err, file) {
    if(err) {
      res.json(err);
      return;
    }

    res.render('fileList', {
      title: {
        page: 'Own file list of ' + userId
        , fileList: 'Own Files'
      }
      , user: {
        id: userId
      }
      , file: file
      , page: {
        path: req.path
      }
    });
  });
};

/**
 * 사용자가 소유한 파일을 조회한다. (페이징처리 포함, 요청 format에 따라 응답이 달라짐)
 * @param {http.ServerRequest} req HTTP request
 *   {String} [req.params.userId] 사용자 ID (optional - 주어지지 않는 경우 로그인한 사용자)
 *   {String} req.params.format 요청 format (json|html(default))
 *   {Number} req.query.lastId 이전에 조회된 마지막 파일 ID (이 ID 다음의 파일을 페이지 크기 만큼 조회한다)
 * @param {http.ServerResponse} res HTTP response
 * @author entireboy
 */
exports.list.ofUser.owns.format = function(req, res) {
  var userId = req.params.userId;
  if(!userId) {
    permission.requireLogin(req, res, function() {
      userId = req.session.user.id;
    });
  }

  var opts = {
    query: {
      'user.own': userId
    }
  };
  if(req.query.lastId) {
    opts.query['file.time'] = {'$lt': new Date(Number(req.query.lastId))}
  }
  retrieveFilesOfUser(opts, function(err, file) {
    if(err) {
      res.json(err);
      return;
    }

    switch(req.params.format)
    {
      case 'json':
        res.json({file: file});
        break;
      case 'html':
      default:
        res.render('fileContent', {file: file}, function(err, html) {
          delete file['list'];
          file.html = html;
          res.json(file);
        });
        break;
    }
  });
};

/**
 * 사용자가 수정 가능한 파일을 조회한다. (페이징처리 포함)
 * @param {http.ServerRequest} req HTTP request
 *   {String} [req.params.userId] 사용자 ID (optional - 주어지지 않는 경우 로그인한 사용자)
 *   {Number} req.query.lastId 이전에 조회된 마지막 파일 ID (이 ID 다음의 파일을 페이지 크기 만큼 조회한다)
 * @param {http.ServerResponse} res HTTP response
 * @author entireboy
 */
exports.list.ofUser.edits = function(req, res) {
  var userId = req.params.userId;
  if(!userId) {
    permission.requireLogin(req, res, function() {
      userId = req.session.user.id;
    });
  }

  var opts = {
    query: {
      'user.edits': userId
    }
  };
  if(req.query.lastId) {
    opts.query['file.time'] = {'$lt': new Date(Number(req.query.lastId))}
  }
  retrieveFilesOfUser(opts, function(err, file) {
    if(err) {
      res.json(err);
      return;
    }

    res.render('fileList', {
      title: {
        page: 'Shared file list (editable) of ' + userId
        , fileList: 'Shared Files (Editable)'
      }
      , user: {
        id: userId
      }
      , file: file
      , page: {
        path: req.path
      }
    });
  });
};

/**
 * 사용자가 수정 가능한 파일을 조회한다. (페이징처리 포함, 요청 format에 따라 응답이 달라짐)
 * @param {http.ServerRequest} req HTTP request
 *   {String} [req.params.userId] 사용자 ID (optional - 주어지지 않는 경우 로그인한 사용자)
 *   {String} req.params.format 요청 format (json|html(default))
 *   {Number} req.query.lastId 이전에 조회된 마지막 파일 ID (이 ID 다음의 파일을 페이지 크기 만큼 조회한다)
 * @param {http.ServerResponse} res HTTP response
 * @author entireboy
 */
exports.list.ofUser.edits.format = function(req, res) {
  var userId = req.params.userId;
  if(!userId) {
    permission.requireLogin(req, res, function() {
      userId = req.session.user.id;
    });
  }

  var opts = {
    query: {
      'user.edits': userId
    }
  };
  if(req.query.lastId) {
    opts.query['file.time'] = {'$lt': new Date(Number(req.query.lastId))}
  }
  retrieveFilesOfUser(opts, function(err, file) {
    if(err) {
      res.json(err);
      return;
    }

    switch(req.params.format)
    {
      case 'json':
        res.json({file: file});
        break;
      case 'html':
      default:
        res.render('fileContent', {file: file}, function(err, html) {
          delete file['list'];
          file.html = html;
          res.json(file);
        });
        break;
    }
  });
};

/**
 * 사용자가 다운로드/보기 가능한 파일을 조회한다. (페이징처리 포함)
 * @param {http.ServerRequest} req HTTP request
 *   {String} [req.params.userId] 사용자 ID (optional - 주어지지 않는 경우 로그인한 사용자)
 *   {Number} req.query.lastId 이전에 조회된 마지막 파일 ID (이 ID 다음의 파일을 페이지 크기 만큼 조회한다)
 * @param {http.ServerResponse} res HTTP response
 * @author entireboy
 */
exports.list.ofUser.views = function(req, res) {
  var userId = req.params.userId;
  if(!userId) {
    permission.requireLogin(req, res, function() {
      userId = req.session.user.id;
    });
  }

  var opts = {
    query: {
      'user.views': userId
    }
  };
  if(req.query.lastId) {
    opts.query['file.time'] = {'$lt': new Date(Number(req.query.lastId))}
  }
  retrieveFilesOfUser(opts, function(err, file) {
    if(err) {
      res.json(err);
      return;
    }

    res.render('fileList', {
      title: {
        page: 'Shared file list (viewable) of ' + userId
        , fileList: 'Shared Files (Viewable)'
      }
      , user: {
        id: userId
      }
      , file: file
      , page: {
        path: req.path
      }
    });
  });
};

/**
 * 사용자가 다운로드/보기 가능한 파일을 조회한다. (페이징처리 포함, 요청 format에 따라 응답이 달라짐)
 * @param {http.ServerRequest} req HTTP request
 *   {String} [req.params.userId] 사용자 ID (optional - 주어지지 않는 경우 로그인한 사용자)
 *   {String} req.params.format 요청 format (json|html(default))
 *   {Number} req.query.lastId 이전에 조회된 마지막 파일 ID (이 ID 다음의 파일을 페이지 크기 만큼 조회한다)
 * @param {http.ServerResponse} res HTTP response
 * @author entireboy
 */
exports.list.ofUser.views.format = function(req, res) {
  var userId = req.params.userId;
  if(!userId) {
    permission.requireLogin(req, res, function() {
      userId = req.session.user.id;
    });
  }

  var opts = {
    query: {
      'user.views': userId
    }
  };
  if(req.query.lastId) {
    opts.query['file.time'] = {'$lt': new Date(Number(req.query.lastId))}
  }
  retrieveFilesOfUser(opts, function(err, file) {
    if(err) {
      res.json(err);
      return;
    }

    switch(req.params.format)
    {
      case 'json':
        res.json({file: file});
        break;
      case 'html':
      default:
        res.render('fileContent', {file: file}, function(err, html) {
          delete file['list'];
          file.html = html;
          res.json(file);
        });
        break;
    }
  });
};

/**
 * 실제 사용자의 파일을 조회한다.
 * @param {Json} opts 파일을 조회할 조건 (MongoDB의 조건)
 * @param {Function} callback 파일 조회 후 호출되는 callback
 *   {Json} err 에러 발생 시 에러
 *   {Json} file 조회된 파일 목록
 */
var retrieveFilesOfUser = function(opts, callback) {
  var listSize = CONFIG.server.file.listSize.userFile;
  var result = {};
  result.list = [];

  mongo.fetchCollection(FILE_COLLECTION, function(err, collection) {
    collection.find(opts.query).limit(listSize + 1).sort({'file.time':-1}).toArray(function(err, docs) {
      if(err || null === docs) {
        callback(error.CANNOT_FIND_FILE_INFO, null);
        return;
      }
      docs.forEach(function(doc, i) {
        if(i != listSize) {
          result.list.push({
            id: doc._id
            , name: doc.file.name
            , uploaded: dateFormat.toDateTime(doc.file.time)
          });
          result.lastId = doc.file.time.getTime();
        } else {
          result.hasMore = true;
        }
      });
      callback(null, result);
    });
  });
};
