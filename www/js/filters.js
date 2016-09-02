'use strict';

angular.module('ndzx.filters', [])
  // 根据时期去搜索该天的所有订单
  .filter('searchDatetimeFromDate', function () {
    return function (input, search) {
      var output = [];
      if (search.hasOwnProperty('date') && typeof (search.date) != undefined && search.date != null) {
        angular.forEach(input, function (item) {
          if (item.created_at.slice(0, 10) == search.date) {
            output.push(item);
          }
        });
        return output;
      }

      return input;
    }
  });
