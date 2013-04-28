var code = {
  AUTHENTICATION_ERROR : 10
  , FIND_ERROR : 20
  , UNKNOWN_ERROR : 90
};


exports.AUTHENTICATION_FAIL = {
  code: code.AUTHENTICATION_ERROR
  , dcode: 11
  , message: 'Authentication error'
  , dmessage: 'Authentication failed, please check your username and password'
};

exports.CANNOT_FIND_FILE_INFO = {
  code: code.FIND_ERROR
  , dcode: 21
  , message: 'Find error'
  , dmessage: 'Cannot find file info from DB'
};
exports.CANNOT_FIND_FILE = {
  code: code.FIND_ERROR
  , dcode: 22
  , message: 'Find error'
  , dmessage: 'Cannot find file from disk'
};
exports.CANNOT_FIND_USER_INFO = {
  code: code.FIND_ERROR
  , dcode: 23
  , message: 'Find error'
  , dmessage: 'Cannot find user info'
};

exports.UNKNOWN = {
  code: code.UNKNOWN_ERROR
  , dcode: 91
  , message: 'Unknown error'
  , dmessage: 'Unknown error occurred'
};
exports.UNKNOWN_MONGO = {
  code: code.UNKNOWN_ERROR
  , dcode: 92
  , message: 'Unknown error'
  , dmessage: 'Unknown error occurred while handling MongoDB'
};
