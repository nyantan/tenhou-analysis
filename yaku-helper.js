"use strict";

var contains = function (haystack, needle) {
  return haystack.indexOf(needle) >= 0;
};

module.exports = {
  isDora: function (yaku) {
    return contains(yaku, '도라');
  },
  isYakuhai: function (yaku) {
    return contains(yaku, '역패');
  },
  isYakuman: function (yaku) {
    return (contains(yaku, '국사무쌍') || contains(yaku, '쓰앙코') || contains(yaku, '대삼원')
      || contains(yaku, '소사희') || contains(yaku, '대사희') || contains(yaku, '자일색')
      || contains(yaku, '청노두') || contains(yaku, '대칠성') || contains(yaku, '녹일색')
      || contains(yaku, '구련보등') || contains(yaku, '스캉츠') || contains(yaku, '천화')
      || contains(yaku, '지화') || contains(yaku, '인화'));
  },
  isPinfu: function (yaku) {
    return contains(yaku, '핑후');
  },
  isRich: function (yaku) {
    return contains(yaku, '리치');
  },
  isItpatsu: function (yaku) {
    return contains(yaku, '일발');
  },
  isTanyao: function (yaku) {
    return contains(yaku, '탕야오');
  }
};
