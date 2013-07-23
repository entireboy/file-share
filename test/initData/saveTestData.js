var mongodb = require('mongodb');
var CONFIG = require('config');


module.exports.save = function(collection, key, datas) {
  // MongoDB connection
  var mongoServer = new mongodb.Server(
    CONFIG.mongodb.host
    , CONFIG.mongodb.port
    , {
      auto_reconnect:CONFIG.mongodb.autoReconnect
      , poolSize:CONFIG.mongodb.pollSize
  });

  var db = new mongodb.Db(CONFIG.mongodb.database, mongoServer,{safe:true});

  db.open(function(err, db) {
    db.collection(collection, function(err, collection) {
      if(err) {
        console.log(err);
        return;
      }
      
      datas.forEach(function(data, i) {
        var criteria = {};
        criteria[key] = data[key];
        collection.update(criteria, data, {upsert: true}, function(err, obj) { checkFin(); });
      });
    });
  });

  var total = datas.length;
  var count = 0;
  function checkFin() {
    count++;
    if(total == count) {
      db.close();
    }
  }
};
