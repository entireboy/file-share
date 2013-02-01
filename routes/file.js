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
  retrieveFilesOfUser(
    req,
    res, {
      title: 'Own file list of ' + req.params.userId,
      fileListTitle: 'Own Files',
      fileType: 'owns',
      query: {'user.own': req.params.userId}});
};

exports.list.ofUser.edits = function(req, res) {
  retrieveFilesOfUser(
    req,
    res, {
      title: 'Shared file list (editable) of ' + req.params.userId,
      fileListTitle: 'Shared Files (Editable)',
      fileType: 'edits',
      query: {'user.edits': req.params.userId}});
};

exports.list.ofUser.views = function(req, res) {
  retrieveFilesOfUser(
    req,
    res, {
      title: 'Shared file list (viewable) of ' + req.params.userId,
      fileListTitle: 'Shared Files (Viewable)',
      fileType: 'views',
      query: {'user.views': req.params.userId}});
};

var retrieveFilesOfUser = function(req, res, opts) {
  var userId = req.params.userId;
  var page = req.query.page;
  if(!page || page < 1) page = 1;
  var listSize = CONFIG.server.file.listSize.userFile;
  var result = {};
  result.title = {};
  result.title.page = opts.title;
  result.title.fileList = opts.fileListTitle;
  result.user = {};
  result.user.id = userId;
  result.file = {};
  result.file.type = opts.fileType;
  result.file.page = page;
  result.file.listSize = listSize;
  result.file[opts.fileType] = [];

  mongo.fetchCollection(FILE_COLLECTION, function(err, collection) {
    collection.find(opts.query).skip((page - 1) * listSize).limit(listSize + 1).sort({'file.time':-1}).toArray(function(err, docs) {
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
      res.render('fileList', result);
    });
  });
};
