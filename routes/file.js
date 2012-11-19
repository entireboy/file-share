var COLLECTION_NAME = 'file';

var mongo = require('./common/mongo');
var fs = require('fs');
var error = require('./common/error');
require('date-utils');
var CONFIG = require('config');



exports.download = function(req, res) {
  var fileId = req.params.fileId;
  mongo.fetchCollection(COLLECTION_NAME, function(err, collection) {
    collection.findOne({_id:fileId}, function(err, doc) {
      if(err || null === doc) {
        res.json(error.CANNOT_FIND_FILE_INFO);
        return;
      }
      
      var filePath = CONFIG.fileServer.upload.path + doc.file.path;
      if(fs.existsSync(filePath)) {
        console.log('download - fileId: ' + fileId + '(' + CONFIG.fileServer.upload.path + doc.path + '), user: ' + req.session.user.id + '(' + req.session.user.name + ')');
        res.download(filePath);
      } else {
        console.log('download fail (cannot find file in disk) - fileId: ' + fileId + '(' + CONFIG.fileServer.upload.path + doc.path + '), user: ' + req.session.user.id + '(' + req.session.user.name + ')');
        res.json(error.CANNOT_FIND_FILE);
        return;
      }
    });
  });
};

exports.info = function(req, res) {
  var fileId = req.params.fileId;
  mongo.fetchCollection(COLLECTION_NAME, function(err, collection) {
    collection.findOne({_id:fileId}, function(err, doc) {
      if(err || null === doc) {
        res.json(error.CANNOT_FIND_FILE_INFO);
        return;
      }
      
      var result = {};
      result.file = {};
      result.file.name = doc.file.name;
      result.file.uploaded = toDateFormat(doc.file.time);
      result.user = {};
      result.user.owner = doc.user.own;
      result.user.editors = doc.user.edits;
      result.user.viewers = doc.user.views;
      result.now = toDateFormat(new Date());
      res.json(result);
    });
  });
};

var toDateFormat = function (date) {
  return date.toFormat('YYYY-MM-DD HH24:MI:SS') + ' +' + date.getUTCOffset();
};
