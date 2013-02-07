var FILE_COLLECTION = 'file';

var dateFormat = require('./common/dateFormat');
var mongo = require('./common/mongo');
var fs = require('fs');
var error = require('./common/error');
var CONFIG = require('config');



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
        console.log('download - fileId: ' + fileId + '(' + CONFIG.server.file.upload.path + doc.path + '), user: ' + req.session.user.id + '(' + req.session.user.name + ')');
        res.download(filePath);
      } else {
        console.log('download fail (cannot find file in disk) - fileId: ' + fileId + '(' + CONFIG.server.file.upload.path + doc.path + '), user: ' + req.session.user.id + '(' + req.session.user.name + ')');
        res.json(error.CANNOT_FIND_FILE);
        return;
      }
    });
  });
};

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
 * 사용자가 권한을 가지고 있는 모든 종류의 파일을 일부만 가져온다. (e.g. own, editable, viewable, ...)
 * @param {http.ServerRequest} req HTTP request
 * @param {http.ServerResponse} res HTTP response
 * @param {Json} result 화면에 돌려줄 결과, 사용자 아이디가 result.user.id의 값으로 반드시 존재해야 함
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

exports.list.ofUser.owns = function(req, res) {
  var opts = {
    query: {
      'user.own': req.params.userId
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
        page: 'Own file list of ' + req.params.userId
        , fileList: 'Own Files'
      }
      , user: {
        id: req.params.userId
      }
      , file: file
      , page: {
        path: req.path
      }
    });
  });
};

exports.list.ofUser.owns.format = function(req, res) {
  var opts = {
    query: {
      'user.own': req.params.userId
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
        res.render('fileContent', {file: file});
        break;
    }
  });
};

exports.list.ofUser.edits = function(req, res) {
  var opts = {
    query: {
      'user.edits': req.params.userId
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
        page: 'Shared file list (editable) of ' + req.params.userId
        , fileList: 'Shared Files (Editable)'
      }
      , user: {
        id: req.params.userId
      }
      , file: file
      , page: {
        path: req.path
      }
    });
  });
};

exports.list.ofUser.edits.format = function(req, res) {
  var opts = {
    query: {
      'user.edits': req.params.userId
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
        res.render('fileContent', {file: file});
        break;
    }
  });
};

exports.list.ofUser.views = function(req, res) {
  var opts = {
    query: {
      'user.views': req.params.userId
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
        page: 'Shared file list (viewable) of ' + req.params.userId
        , fileList: 'Shared Files (Viewable)'
      }
      , user: {
        id: req.params.userId
      }
      , file: file
      , page: {
        path: req.path
      }
    });
  });
};

exports.list.ofUser.views.format = function(req, res) {
  var opts = {
    query: {
      'user.views': req.params.userId
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
        res.render('fileContent', {file: file});
        break;
    }
  });
};

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
