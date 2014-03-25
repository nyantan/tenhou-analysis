(function ($) {
$(function () {
  var reloadGameList = function () {
    $.ajax('/game', {
      type: 'GET',
      dataType: 'json',
      success: function (result) {
        var gameTemplate = Handlebars.compile($("#GameTemplate").html());
        $("#GameList").empty();
        $.each(result, function (index, game) {
          $("#GameList").append($(gameTemplate(game)));
        });
      }
    });
  };

  $('#RegisterGameForm').submit(function (e) {
    var gid = $('#RegisterGameForm input.text.gid').val();

    var gidRegex = /\w{10}gm-\w+-\w+-\w{8}/g;
    var gidRegexArray = gidRegex.exec(gid);

    if (!gidRegexArray) {
      $('#RegisterGameForm .warning').text('정상적인 아이디가 아닙니다. 입력을 다시 확인해주세요.');
      return;
    } else {
      $('#RegisterGameForm .warning').text('');
    }

    gid = gidRegexArray[0];

    $.ajax('/game', {
      type: 'PUT',
      data: {gid: gid},
      dataType: 'json',
      success: function (result) {
        if (result.success) {
          reloadGameList();
        }
      },
      error: function (err) {
        var errorStr;
        try {
          errorStr = JSON.stringify(err.responseJSON);
        } catch (err) {
          errorStr = 'Internal Server Error';
        }

        $('#RegisterGameForm .warning').text('게임 등록에 실패하였습니다. 에러: ' + errorStr);
      }
    });

    e.preventDefault();
  });

  reloadGameList();
});
}(jQuery));
