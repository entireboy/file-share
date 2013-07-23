var saver = require('./saveTestData.js');

var files = [
  {_id:'11111', file:{name:'test.jpg', size:318601, path:'/u1/test.jpg', type:'image/jpeg', time:new Date(Date.now() + 10)}, share:'PRIVATE', user:{own:'u1', edits:['u2']}}
  , {_id:'22222', file:{name:'test.mp4', size:2492609, path:'/u1/test.mp4', type:'video/mp4', time:new Date(Date.now() + 20)}, share:'PRIVATE', user:{own:'u1'}}
  , {_id:'33333', file:{name:'test.txt', size:18, path:'/u2/test.txt', type:'text/plain', time:new Date(Date.now() + 30)}, share:'PRIVATE', user:{own:'u2', views:['u1']}}
  , {_id:'44444', file:{name:'test.xlsx', size:29118, path:'/u2/test.xlsx', type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', time:new Date(Date.now() + 40)}, share:'PRIVATE', user:{own:'u2'}}
  , {_id:'55555', file:{name:'test2.png', size:220295, path:'/u1/test2.png', type:'image/png', time:new Date(Date.now() + 50)}, share:'PUBLIC', user:{own:'u1', edits:['u2']}}
];

saver.save('file', '_id', files);
