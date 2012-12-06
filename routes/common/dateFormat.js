require('date-utils');

/**
 * 주어진 Date 객체를 날짜와 시간이 표시된 형식으로 반환한다.
 * @param {Date} date 형식을 변환할 날짜
 * @return {String} 형식 변환된 날짜
 */
exports.toDateTime = function (date) {
  return date.toFormat('YYYY-MM-DD HH24:MI:SS') + ' +' + date.getUTCOffset();
};
