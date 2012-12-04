var saver = require('./saveTestData.js');

var users = [
  {_id:'u1', name:'user1', password:'p1'}
  , {_id:'u2', name:'user2', password:'p2'}
  , {_id:'u3', name:'user3', password:'p3'}
];

saver.save('user', '_id', users);
