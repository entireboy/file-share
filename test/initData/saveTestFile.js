var saver = require('./saveTestData.js');

var files = [
  {_id:'11111', file:{name:'test.jpg', path:'/u1/test.jpg', time:new Date(Date.now() + 10)}, share:'PRIVATE', user:{own:'u1', edits:['u2']}}
  , {_id:'22222', file:{name:'test.mp4', path:'/u1/test.mp4', time:new Date(Date.now() + 20)}, share:'PRIVATE', user:{own:'u1'}}
  , {_id:'33333', file:{name:'test.txt', path:'/u2/test.txt', time:new Date(Date.now() + 30)}, share:'PRIVATE', user:{own:'u2', views:['u1']}}
  , {_id:'44444', file:{name:'test.xlsx', path:'/u2/test.xlsx', time:new Date(Date.now() + 40)}, share:'PRIVATE', user:{own:'u2'}}
  , {_id:'55555', file:{name:'test.png', path:'/u1/test.png', time:new Date(Date.now() + 50)}, share:'PUBLIC', user:{own:'u1', edits:['u2']}}
];

saver.save('file', '_id', files);
