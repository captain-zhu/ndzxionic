// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('ndzx', ['ionic', 'ndzx.controllers', 'ndzx.services', 'ndzx.filters'])

.run(function($ionicPlatform, $rootScope, $ionicLoading) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    // 每个页面转换时，出现载入图画
    $rootScope.$on('loading:show', function () {
      $ionicLoading.show({
        template: '<ion-spinner></ion-spinner> 载入中 ...'
      })
    });

    $rootScope.$on('loading:hide', function () {
      $ionicLoading.hide();
    });

    $rootScope.$on('$stateChangeStart', function () {
      console.log('Loading ...');
      $rootScope.$broadcast('loading:show');
    });

    $rootScope.$on('$stateChangeSuccess', function () {
      console.log('done');
      $rootScope.$broadcast('loading:hide');
    });
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    // 首页
  .state('app', {
    url: '/app',
    templateUrl: 'templates/main.html',
    controller: 'AppController'
  })

    // 管理员首页
  .state('admin', {
    url: '/admin',
    abstract: true,
    templateUrl: 'templates/admin/sidebar.html',
    controller: 'AdminSidebarController',
    resolve: {
      editInfo : ['adminFactory', function (adminFactory) {
        return adminFactory.get({
          id : 1
        });
      }]
    }
  })

    // 管理用户页
  .state('admin.users', {
    url: '/users',
    views: {
      'mainContent': {
        templateUrl: 'templates/admin/users.html',
        controller: 'AdminUsersController',
        resolve: {
          users : ['userFactory', function (userFactory) {
            return userFactory.query();
          }],
          menus : ['menuFactory', function (menuFactory) {
            return menuFactory.get();
          }]
        }
      }
    }
  })

    // 管理菜单页
  .state('admin.menus', {
    url: '/menus',
    views: {
      'mainContent': {
        templateUrl: 'templates/admin/menus.html',
        controller: 'AdminMenusController',
        resolve: {
          menus : ['menuFactory', function (menuFactory) {
            return menuFactory.get();
          }]
        }
      }
    }
  })

    // 管理订单页
  .state('admin.orders', {
    url: '/orders',
    views: {
      'mainContent': {
        templateUrl: 'templates/admin/orders.html',
        controller: 'AdminOrdersController',
        resolve: {
          orders : ['orderFactory', function (orderFactory) {
            return orderFactory.query();
          }]
        }
      }
    }
  })

    // 管理充值页
  .state('admin.deposits', {
    url: '/deposits',
    views: {
      'mainContent': {
        templateUrl: 'templates/admin/deposits.html',
        controller: 'AdminDepositsController',
        resolve: {
          deposits : ['depositFactory', function (depositFactory) {
            return depositFactory.query();
          }]
        }
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app');
});
