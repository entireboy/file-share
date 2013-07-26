/* ====================================================
 * 시스템 전체적으로 필요한 common module
 * ==================================================== */


/**
 * 천단위 콤마(,) 등 숫자 관련 포멧을 변경해준다.
 * opt가 주어지지 않거나 opt.unit이 지정된 값이 아닌 경우는 천단위 마다 콤마만 찍어서 반환한다.
 *
 * @param {Json} [opt] 변경할 포멧 옵션 (주어지지 않는 경우 default로 천단위 마다 콤마만 찍어서 반환한다.)
 *   opt.unit {없음|'KMB'|'KMG'} 축약해서 보여줄 숫자 표현 형식 (소수점 1자리까지 보여준다.)
 *     없음: 천단위 마다 콤마만 추가된 숫자 표현
 *     'KMB': Thousands / Millions / Billions 단위의 숫자 표현 (일반적인 1000 단위로 표현)
 *     'KMG': Kilo / Mega / Giga / Tera 단위의 숫자 표현 (파일 사이즈처럼 1024 단위로 표현)
 * @return {String} 지정된 포멧으로 변경된 숫자
 */
Number.prototype.numberFormat = function(opt) {
  var result = this;
  if(opt && opt.unit) {
    switch(opt.unit) {
      case 'KMB':
        var units = ['', 'K', 'M', 'B'];
        var cnt = 0;
        while(1000 <= result) {
          result = Math.round((result * 100) / 1000) / 100;
          cnt++;
        }
        return result + units[cnt];
        break;
      case 'KMG':
        var units = ['B', 'K', 'M', 'G', 'T', 'P'];
        var cnt = 0;
        while(1024 <= result) {
          result = Math.round((result * 100) / 1024) / 100;
          cnt++;
        }
        return result + units[cnt];
        break;
    }
  }

  // option 설정이 없거나, 해당하는 옵션이 없는 경우 천 단위 마다 콤마(,)
  return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
