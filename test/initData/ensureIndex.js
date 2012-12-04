var mongodb = require('mongodb');
var CONFIG = require('config');


var datas = [
  {collection: 'file', index: {'user.own': 1}}
  , {collection: 'file', index: {'user.edits': 1}}
  , {collection: 'file', index: {'user.views': 1}}
];



// MongoDB connection
var mongoServer = new mongodb.Server(
  CONFIG.mongodb.host
  , CONFIG.mongodb.port
  , {
    auto_reconnect:CONFIG.mongodb.autoReconnect
    , poolSize:CONFIG.mongodb.pollSize
});

var db = new mongodb.Db(CONFIG.mongodb.database, mongoServer,{safe:true});

function ensureIndex(collection, index) {
  db.collection(collection, function(err, collection) {
    if(err) {
      console.log(err);
      return;
    }

    collection.ensureIndex(index, function(err) {
      if(err) {
        console.log(err);
        return;
      }
      checkFin();
    });
  });
}

var total = datas.length;
var count = 0;
function checkFin() {
  count++;
  if(total == count) {
    db.close();
  }
}

datas.forEach(function(item, i) {
  ensureIndex(item.collection, item.index);
});
