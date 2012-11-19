/**
 * Fetch the MongoDB collection
 * 
 * @param {String} collecitonName colleciton name to fetch
 * @param {Function} callback returns fetched MongoDB colleciton
 */
exports.fetchCollection = function(collectionName, callback) {
  require.main.db.fileShare.collection(collectionName, function(err, collection) {
    if(err) callback(err, null);
    else callback(null, collection);
  });
};
