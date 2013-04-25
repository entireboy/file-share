/**
 * config에 설정된 MongoDB에서 주어진 이름의 collection을 얻어온다.
 * 
 * @param {String} collecitonName collection 이름
 * @param {Function} callback
 *   {Error} err 에러 발생 시 에러
 *   {Object} collection 얻어온 MongoDB collection
 * 
 */
exports.fetchCollection = function(collectionName, callback) {
  require.main.db.fileShare.collection(collectionName, function(err, collection) {
    if(err) callback(err, null);
    else callback(null, collection);
  });
};
