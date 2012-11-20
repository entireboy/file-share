var saver = require('./saveTestData.js');

var users = [
  {id:'u1', name:'user1', password:'p1'}
  , {id:'u2', name:'user2', password:'p2'}
  , {id:'u3', name:'user3', password:'p3'}
];

saver.save('user', 'id', users);
