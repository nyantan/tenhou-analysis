(function ($, data) {
var userRowTemplate = Handlebars.compile($("#UserRowTemplate").html());
var reloadList = function (data, orderBy, ascending) {
  $("#UserTableBody").empty();

  data.sort(function (a, b) {
    if (ascending) {
      return a[orderBy] - b[orderBy];
    } else {
      return b[orderBy] - a[orderBy];
    }
  });

  $.each(data, function (index, user) {
    $("#UserTableBody").append($(userRowTemplate(user)));
  });

  $("table.user-table th span.order").text('');
  $("table.user-table th." + orderBy + " span.order").text(ascending ? '▲' : '▼');
};

$(function () {
  reloadList(data, 'rankRate', true);

  var currentOrdering = ['rankRate', true];
  $("table.user-table th").click(function (e) {
    var orderBy = $(this).attr('class').trim();

    if (currentOrdering[0] === orderBy) {
      currentOrdering[1] = !currentOrdering[1];
    } else {
      currentOrdering[0] = orderBy;
      if (orderBy === 'rankRate' || orderBy === 'shotRate') {
        currentOrdering[1] = true;
      } else {
        currentOrdering[1] = false;
      }
    }

    reloadList(data, currentOrdering[0], currentOrdering[1]);
  });
});
}(jQuery, data));
