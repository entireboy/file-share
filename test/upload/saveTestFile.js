var mongodb = require('mongodb');
var CONFIG = require('config');


var datas = [
  {_id:'f1', file:{name:'test.jpg', path:'/u1/test.jpg', time:new Date()}, user:{own:'u1', edits:['u2']}}
  , {_id:'f2', file:{name:'test.mp4', path:'/u1/test.mp4', time:new Date()}, user:{own:'u1'}}
  , {_id:'f3', file:{name:'test.txt', path:'/u2/test.txt', time:new Date()}, user:{own:'u2', views:['u1']}}
  , {_id:'f4', file:{name:'test.xlsx', path:'/u2/test.xlsx', time:new Date()}, user:{own:'u2'}}
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

db.collection('file', function(err, collection) {
  if(err) {
    console.log(err);
    return;
  }
  
  datas.forEach(function(data, i) {
    collection.update({_id: data._id}, data, {upsert: true}, function(err, obj) { checkFin(); });
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
