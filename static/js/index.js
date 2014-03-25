(function ($) {
$(function () {
  $('#RegisterGameForm').submit(function (e) {
    var gid = $('input.text.gid', this).val();

    var gidRegex = /\w{10}gm-\w{4}-\w{4}-\w{8}/g;
    var gidRegexArray = gidRegex.exec(gid);

    if (!gidRegexArray) {
      $('.warning', this).text('정상적인 아이디가 아닙니다. 입력을 다시 확인해주세요.');
      return;
    } else {
      $('.warning', this).text('');
    }

    gid = gidRegexArray[0];

    $.ajax('/game', {
      type: 'PUT',
      data: {gid: gid},
      dataType: 'json',
      success: function (result) {
        if (result.success) {
          location.reload();
        }
      },
      error: function (err) {
        var errorStr;
        try {
          errorStr = JSON.stringify(err);
        } catch (err) {
          errorStr = 'Internal Server Error';
        }

        $('.warning', this).text('게임 등록에 실패하였습니다. 에러: ' + errorStr);
      }
    });

    e.preventDefault();
  });
});
}(jQuery));
