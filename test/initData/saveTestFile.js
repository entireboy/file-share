var saver = require('./saveTestData.js');

var files = [
  {_id:'f1', file:{name:'test.jpg', path:'/u1/test.jpg', time:new Date()}, user:{own:'u1', edits:['u2']}}
  , {_id:'f2', file:{name:'test.mp4', path:'/u1/test.mp4', time:new Date()}, user:{own:'u1'}}
  , {_id:'f3', file:{name:'test.txt', path:'/u2/test.txt', time:new Date()}, user:{own:'u2', views:['u1']}}
  , {_id:'f4', file:{name:'test.xlsx', path:'/u2/test.xlsx', time:new Date()}, user:{own:'u2'}}
];

saver.save('file', '_id', files);
