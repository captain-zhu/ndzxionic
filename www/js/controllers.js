angular.module('ndzx.controllers', [])
  .constant("baseURL", "http://fz.garmintech.net/api/")
  .controller('AppController', function ($scope, $ionicModal, AuthFactory, $localStorage, $state, $rootScope) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    // Form data for the login modal
    $scope.loginData = $localStorage.getObject('admininfo', '{}');
    $scope.loggedInAsAdmin = false;

    if (AuthFactory.isAuthenticated()) {
      $scope.loggedInAsAdmin = true;
    }

    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/login.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.modal = modal;
    });

    // Triggered in the login modal to close it
    $scope.closeLogin = function () {
      $scope.modal.hide();
    };

    // Open the login modal
    $scope.loginAsAdmin = function () {
      $scope.modal.show();
    };

    // Perform the login action when the user submits the login form
    $scope.doLoginAsAdmin = function () {
      $localStorage.storeObject('admininfo', $scope.loginData);

      AuthFactory.login($scope.loginData);

    };

    // 监听管理员成功登录的信息
    $rootScope.$on('AdminLogin:Successful', function () {
      $scope.closeLogin();
      $state.go('admin.users');
    });
  })

  // 管理员界面左导航栏控制器
  .controller('AdminSidebarController', ['$scope', '$ionicModal', 'AuthFactory', '$http', '$ionicPopup', 'adminFactory', '$state', 'baseURL', 'editInfo', function ($scope, $ionicModal, AuthFactory, $http, $ionicPopup, adminFactory, $state, baseURL, editInfo) {
    // 检测管理员是否已经登录
    AuthFactory.middleware();
    $scope.editInfo = editInfo;
    $scope.username = AuthFactory.getUsername();
    // 修改管理员信息
    $ionicModal.fromTemplateUrl('templates/admin/editadmininfo.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.editAdminModal = modal
    });
    $scope.closeEdit = function () {
      $scope.editAdminModal.hide();
    };
    $scope.editAdminInfo = function () {
      $scope.editAdminModal.show();
    };
    $scope.doEditAdminInfo = function () {
      console.log($scope.editInfo);
      $http.post(baseURL + 'edit', $scope.editInfo).then(
        function (response) {
          console.log(response);
          if (response.data.type == 'fail') {
            var alertPopup = $ionicPopup.alert({
              title: '<h4>编辑用户信息失败</h4>',
              template: '<div>每项信息都不能为空，输入的两次密码必须相同</div>'
            });

            alertPopup.then(function (res) {

            });
          } else {
            $scope.closeEdit();
          }
        }, function (response) {
          var alertPopup = $ionicPopup.alert({
            title: '<h4>错误</h4>',
            template: '<div>连接服务器出错</div>'
          });

          alertPopup.then(function (res) {

          });
        }
      );
    };

    // 退出登录
    $scope.logOut = function () {
      AuthFactory.logout();
      $state.go('app');
    };

  }])

  // 用户管理
  .controller('AdminUsersController',
    ['$scope', 'users', 'AuthFactory', '$ionicModal', 'baseURL', '$state', '$rootScope',
      '$http', 'userFactory', '$ionicPopup', 'depositFactory', 'menus', 'orderFactory',
      function ($scope, users, AuthFactory, $ionicModal, baseURL, $state, $rootScope,
                $http, userFactory, $ionicPopup, depositFactory, menus, orderFactory) {
        // 判断是否已经登录，没有登录不让其使用本页
        AuthFactory.middleware();

        // 数据
        $scope.users = users;
        $scope.menus = menus;
        $scope.search = {};
        // 获得分组信息
        $scope.groups = [];
        $http({
          method: "GET",
          url: baseURL + 'usergroups'
        }).then(function (response) {
          response.data.map(function (obj) {
            $scope.groups.push({
              value: obj,
              label: obj
            });
          });
        }, function (response) {

        });

        // 下拉刷新
        $scope.doRefresh = function () {
          console.log('Refreshing!');
          userFactory.query().$promise.then(
            function (response) {
              $scope.users = response;
              $scope.search = {};
              $scope.$broadcast('scroll.refreshComplete');
            },
            function (response) {

            }
          )
        };

        // 搜索
        $ionicModal.fromTemplateUrl('templates/admin/searchusers.html', {
          scope: $scope
        }).then(function (modal) {
          $scope.searchModal = modal
        });
        $scope.closeSearch = function () {
          $scope.searchModal.hide();
        };
        $scope.searchUsers = function () {
          $scope.searchModal.show();
        };
        $scope.doSearchUsers = function () {
          $scope.closeSearch();
        };
        // 编辑用户信息
        $ionicModal.fromTemplateUrl('templates/admin/edituserinfo.html', {
          scope: $scope
        }).then(function (modal) {
          $scope.editUserModal = modal
        });
        $scope.closeEditUser = function () {
          $scope.users[$scope.editUserIndex] = $scope.priorUser;
          $scope.editUserModal.hide();
        };
        $scope.showEditUser = function (index) {
          $scope.editUserIndex = index;
          $scope.priorUser = angular.copy($scope.users[index]);
          $scope.editUserModal.show();
        };
        $scope.doEditUserInfo = function () {
          // 更新用户信息
          userFactory.update({
            id: $scope.users[$scope.editUserIndex].id
          }, {
            name: $scope.users[$scope.editUserIndex].userinfo.name,
            telephone: $scope.users[$scope.editUserIndex].userinfo.telephone,
            privilege: $scope.users[$scope.editUserIndex].privilege
          }).$promise.then(function (response) {
            if (response.type == 'fail') {
              var message = '<div><p>各项信息不能为空，姓名必须为中文，手机号码必须为11位数字</p></div>';

              var alertPopup = $ionicPopup.alert({
                title: '<h4>更新用户信息失败</h4>',
                template: message
              });

              alertPopup.then(function (res) {
                $scope.users[$scope.editUserIndex] = $scope.priorUser;
              });
            } else {
              $scope.editUserModal.hide();
            }
          }, function (response) {
            var message = '<div><p>连接服务器失败</p></div>';

            var alertPopup = $ionicPopup.alert({
              title: '<h4>更新用户信息失败</h4>',
              template: message
            });

            alertPopup.then(function (res) {
              $scope.users[editUserIndex] = $scope.priorUser;
            });
          });
        };

        // 单个用户充值
        $scope.depositorder = {};
        $ionicModal.fromTemplateUrl('templates/admin/depositforuser.html', {
          scope: $scope
        }).then(function (modal) {
          $scope.depositForUserModal = modal
        });
        $scope.closeDepositForUser = function () {
          $scope.depositorder = {};
          $scope.depositForUserModal.hide();
        };
        $scope.showDepositForUser = function (index) {
          $scope.depositUserIndex = index;
          $scope.depositForUserModal.show();
        };
        $scope.doDepositForUser = function () {
          // 更新用户信息
          depositFactory.save({}, {
            user_id: $scope.users[$scope.depositUserIndex].id,
            value: $scope.depositorder.value,
            type: 0,
            adminname: AuthFactory.getUsername()
          }).$promise.then(function (response) {
            if (response.type == 'fail') {
              var message = '<div><p>请输入数字</p></div>';

              var alertPopup = $ionicPopup.alert({
                title: '<h4>充值失败</h4>',
                template: message
              });

              alertPopup.then(function (res) {

              });
            } else {
              $scope.users[$scope.depositUserIndex].gold = (Number($scope.users[$scope.depositUserIndex].gold) + Number($scope.depositorder.value)).toFixed(2);
              $scope.depositorder = {};
              $scope.depositForUserModal.hide();
            }
          }, function (response) {
            var message = '<div><p>连接服务器失败</p></div>';

            var alertPopup = $ionicPopup.alert({
              title: '<h4>充值失败</h4>',
              template: message
            });

            alertPopup.then(function (res) {

            });
          });
        };

        // 全组充值
        $scope.groupOrder = {};
        $ionicModal.fromTemplateUrl('templates/admin/depositforgroup.html', {
          scope: $scope
        }).then(function (modal) {
          $scope.depositForGroupModal = modal
        });
        $scope.closeDepositForGroup = function () {
          $scope.groupOrder = {};
          $scope.depositForGroupModal.hide();
        };
        $scope.showDepositForGroup = function () {
          $scope.depositForGroupModal.show();
        };
        $scope.doDepositForGroup = function () {
          $http({
            method: 'POST',
            url: baseURL + 'depositforgroups',
            data: {
              privilege: $scope.groupOrder.mygroup,
              value: $scope.groupOrder.value,
              adminname: AuthFactory.getUsername()
            }
          }).then(function (response) {
            if (response.type == 'fail') {
              var message = '<div><p>请按正确的格式输入金额</p></div>';

              var alertPopup = $ionicPopup.alert({
                title: '<h4>充值失败</h4>',
                template: message
              });

              alertPopup.then(function (res) {

              });
            } else {
              var message = '<div><p>充值成功</p></div>';

              var alertPopup = $ionicPopup.alert({
                title: '<h4>充值成功</h4>',
                template: message
              });

              alertPopup.then(function (res) {
                for (var i = 0; i < $scope.users.length; i++) {
                  if ($scope.users[i].hasOwnProperty('privilege')) {
                    if ($scope.users[i]['privilege'] == $scope.groupOrder.mygroup) {
                      $scope.users[i]['gold'] = (Number($scope.users[i]['gold']) + Number($scope.groupOrder.value)).toFixed(2);
                    }
                  }
                }
                $scope.groupOrder = {};
                $scope.depositForGroupModal.hide();
              });
            }
          }, function (response) {
            var message = '<div><p>连接服务器失败</p></div>';

            var alertPopup = $ionicPopup.alert({
              title: '<h4>充值失败</h4>',
              template: message
            });

            alertPopup.then(function (res) {

            });
          });
        };

        //  订餐
        $scope.orderData = {
          breakfast: '',
          lunch: '',
          dinner: '',
          date: ''
        };
        $scope.orderInfos = {};
        $ionicModal.fromTemplateUrl('templates/admin/orderfood.html', {
          scope: $scope
        }).then(function (modal) {
          $scope.orderFoodModal = modal
        });
        $scope.closeOrderFood = function () {
          $scope.orderData['breakfast'] = '';
          $scope.orderData['lunch'] = '';
          $scope.orderData['dinner'] = '';
          $scope.orderFoodModal.hide();
        };
        $scope.showOrderFood = function (index) {
          $scope.orderUserIndex = index;
          // 获得订餐的时间
          $http({
            method: "GET",
            url: baseURL + 'dinnerdate'
          }).then(function (response) {
            $scope.orderData.date = response.data.date;
            // 获得用户现在的订餐信息
            $http({
              method: "PATCH",
              url: baseURL + 'orderinfos',
              data: {
                user_id: $scope.users[index].id,
                date: $scope.orderData.date
              }
            }).then(
              function (response) {
                $scope.orderInfos = response.data;
                $scope.orderFoodModal.show();
              }, function (response) {
                var message = '<div><p>连接服务器失败</p></div>';

                var alertPopup = $ionicPopup.alert({
                  title: '<h4>订餐失败</h4>',
                  template: message
                });

                alertPopup.then(function (res) {

                });
              });
          }, function (response) {
            var message = '<div><p>连接服务器失败</p></div>';

            var alertPopup = $ionicPopup.alert({
              title: '<h4>订餐失败</h4>',
              template: message
            });

            alertPopup.then(function (res) {

            });
          });
        };

        // 订早餐
        $scope.doOrderBreakfast = function () {
          // 保存订餐信息
          orderFactory.save({}, {
            'user_id': $scope.users[$scope.orderUserIndex].id,
            'menu_id': $scope.menus[0].id,
            'single_value': $scope.menus[0].value,
            'count': $scope.orderData.breakfast,
            'order': 1,
            'date': $scope.orderData.date
          }).$promise.then(
            function (response) {
              if (response.type == 'fail') {
                var message = '<div><p>' + response.msg + '</p></div>';

                var alertPopup = $ionicPopup.alert({
                  title: '<h4>订餐失败</h4>',
                  template: message
                });

                alertPopup.then(function (res) {
                  $http({
                    method: "PATCH",
                    url: baseURL + 'orderinfos',
                    data: {
                      user_id: $scope.users[$scope.orderUserIndex].id,
                      date: $scope.orderData.date
                    }
                  }).then(
                    function (response) {
                      $scope.orderInfos = response.data;
                    }, function (response) {
                      var message = '<div><p>连接服务器失败</p></div>';

                      var alertPopup = $ionicPopup.alert({
                        title: '<h4>订餐失败</h4>',
                        template: message
                      });

                      alertPopup.then(function (res) {

                      });
                    });
                });
              } else {
                var message = '<div><p>订餐成功</p></div>';

                var alertPopup = $ionicPopup.alert({
                  title: '<h4>订餐成功</h4>',
                  template: message
                });

                alertPopup.then(function (res) {
                  $scope.users[$scope.orderUserIndex].gold = (Number($scope.users[$scope.orderUserIndex].gold) - Number($scope.menus[0].value)).toFixed(2);
                  $scope.orderData['breakfast'] = '';
                  $scope.orderData['lunch'] = '';
                  $scope.orderData['dinner'] = '';
                  $scope.orderFoodModal.hide();
                });
              }
            }, function (response) {
              var message = '<div><p>连接服务器失败</p></div>';

              var alertPopup = $ionicPopup.alert({
                title: '<h4>订餐失败</h4>',
                template: message
              });

              alertPopup.then(function (res) {

              });
            }
          );
        };

        // 订午餐
        $scope.doOrderLunch = function () {
          // 保存订餐信息
          orderFactory.save({}, {
            'user_id': $scope.users[$scope.orderUserIndex].id,
            'menu_id': $scope.menus[1].id,
            'single_value': $scope.menus[1].value,
            'count': $scope.orderData.lunch,
            'order': 2,
            'date': $scope.orderData.date
          }).$promise.then(
            function (response) {
              if (response.type == 'fail') {
                var message = '<div><p>' + response.msg + '</p></div>';

                var alertPopup = $ionicPopup.alert({
                  title: '<h4>订餐失败</h4>',
                  template: message
                });

                alertPopup.then(function (res) {
                  $http({
                    method: "PATCH",
                    url: baseURL + 'orderinfos',
                    data: {
                      user_id: $scope.users[$scope.orderUserIndex].id,
                      date: $scope.orderData.date
                    }
                  }).then(
                    function (response) {
                      $scope.orderInfos = response.data;
                    }, function (response) {
                      var message = '<div><p>连接服务器失败</p></div>';

                      var alertPopup = $ionicPopup.alert({
                        title: '<h4>订餐失败</h4>',
                        template: message
                      });

                      alertPopup.then(function (res) {

                      });
                    });
                });
              } else {
                var message = '<div><p>订餐成功</p></div>';

                var alertPopup = $ionicPopup.alert({
                  title: '<h4>订餐成功</h4>',
                  template: message
                });

                alertPopup.then(function (res) {
                  $scope.users[$scope.orderUserIndex].gold = (Number($scope.users[$scope.orderUserIndex].gold) - Number($scope.menus[1].value)).toFixed(2);
                  $scope.orderData['breakfast'] = '';
                  $scope.orderData['lunch'] = '';
                  $scope.orderData['dinner'] = '';
                  $scope.orderFoodModal.hide();
                });
              }
            }, function (response) {
              var message = '<div><p>连接服务器失败</p></div>';

              var alertPopup = $ionicPopup.alert({
                title: '<h4>订餐失败</h4>',
                template: message
              });

              alertPopup.then(function (res) {

              });
            }
          );
        };

        // 订晚餐
        $scope.doOrderDinner = function () {
          // 保存订餐信息
          orderFactory.save({}, {
            'user_id': $scope.users[$scope.orderUserIndex].id,
            'menu_id': $scope.menus[2].id,
            'single_value': $scope.menus[2].value,
            'count': $scope.orderData.dinner,
            'order': 3,
            'date': $scope.orderData.date
          }).$promise.then(
            function (response) {
              if (response.type == 'fail') {
                var message = '<div><p>' + response.msg + '</p></div>';

                var alertPopup = $ionicPopup.alert({
                  title: '<h4>订餐失败</h4>',
                  template: message
                });

                alertPopup.then(function (res) {
                  $http({
                    method: "PATCH",
                    url: baseURL + 'orderinfos',
                    data: {
                      user_id: $scope.users[$scope.orderUserIndex].id,
                      date: $scope.orderData.date
                    }
                  }).then(
                    function (response) {
                      $scope.orderInfos = response.data;
                    }, function (response) {
                      var message = '<div><p>连接服务器失败</p></div>';

                      var alertPopup = $ionicPopup.alert({
                        title: '<h4>订餐失败</h4>',
                        template: message
                      });

                      alertPopup.then(function (res) {

                      });
                    });
                });
              } else {
                var message = '<div><p>订餐成功</p></div>';

                var alertPopup = $ionicPopup.alert({
                  title: '<h4>订餐成功</h4>',
                  template: message
                });

                alertPopup.then(function (res) {
                  $scope.users[$scope.orderUserIndex].gold = (Number($scope.users[$scope.orderUserIndex].gold) - Number($scope.menus[2].value)).toFixed(2);
                  $scope.orderData['breakfast'] = '';
                  $scope.orderData['lunch'] = '';
                  $scope.orderData['dinner'] = '';
                  $scope.orderFoodModal.hide();
                });
              }
            }, function (response) {
              var message = '<div><p>连接服务器失败</p></div>';

              var alertPopup = $ionicPopup.alert({
                title: '<h4>订餐失败</h4>',
                template: message
              });

              alertPopup.then(function (res) {

              });
            }
          );
        };
      }])

  // 菜单与菜品管理
  .controller('AdminMenusController', ['$scope', 'menus', 'AuthFactory', '$ionicModal', 'menuFactory',
    '$ionicPopup', 'dinnerFactory', '$state', 'dishFactory',
    function ($scope, menus, AuthFactory, $ionicModal, menuFactory, $ionicPopup, dinnerFactory, $state, dishFactory) {
      // middleware
      AuthFactory.middleware();
      // init
      $scope.tab = 1;
      $scope.menus = menus;
      $scope.select = function (setTab) {
        $scope.tab = setTab;
      };
      $scope.isSelected = function (checkTab) {
        return ($scope.tab === checkTab);
      };
      // 修改价格
      $scope.valueData = {};
      $ionicModal.fromTemplateUrl('templates/admin/changevalue.html', {
        scope: $scope
      }).then(function (modal) {
        $scope.changeValueModal = modal
      });
      $scope.closeChangeValue = function () {
        $scope.changeValueModal.hide();
      };
      $scope.changeValue = function () {
        $scope.valueData.value = angular.copy($scope.menus[$scope.tab - 1].value);
        $scope.changeValueModal.show();
      };
      $scope.doChangeValue = function () {
        menuFactory.update({
          id: $scope.tab
        }, {
          value: $scope.valueData.value
        }).$promise.then(
          function (response) {
            if (response.type == 'fail') {
              var message = '<div><p>' + response.msg + '</p></div>';

              var alertPopup = $ionicPopup.alert({
                title: '<h4>改变价格失败</h4>',
                template: message
              });

              alertPopup.then(function (res) {

              });
            } else {
              var message = '<div><p>改变价格成功</p></div>';

              var alertPopup = $ionicPopup.alert({
                title: '<h4>改变价格成功</h4>',
                template: message
              });

              alertPopup.then(function (res) {
                $scope.menus[$scope.tab - 1].value = angular.copy($scope.valueData.value);
                $scope.closeChangeValue();
              });
            }
          }, function (response) {
            var message = '<div><p>' + response.msg + '</p></div>';

            var alertPopup = $ionicPopup.alert({
              title: '<h4>改变价格失败</h4>',
              template: message
            });

            alertPopup.then(function (res) {

            });
          }
        );
      };

      $scope.timeData = {};

      // 修改开始时间
      $ionicModal.fromTemplateUrl('templates/admin/changestarttime.html', {
        scope: $scope
      }).then(function (modal) {
        $scope.changeStartTimeModal = modal
      });
      $scope.closeChangeStartTime = function () {
        $scope.changeStartTimeModal.hide();
      };
      $scope.changeStartTime = function () {
        $scope.timeData.startTime = new Date(angular.copy($scope.menus[$scope.tab - 1].dinner.start_time));
        $scope.changeStartTimeModal.show();
      };
      $scope.doChangeStartTime = function () {
        var time = $scope.timeData.startTime;
        var newDate = time.toTimeString().split(' ')[0];
        dinnerFactory.update({
          id: $scope.tab
        }, {
          start_time: newDate
        }).$promise.then(
          function (response) {
            if (response.type == 'fail') {
              var message = '<div><p>' + response.msg + '</p></div>';

              var alertPopup = $ionicPopup.alert({
                title: '<h4>改变订餐开始时间失败</h4>',
                template: message
              });

              alertPopup.then(function (res) {

              });
            } else {
              var message = '<div><p>改变订餐开始时间成功</p></div>';

              var alertPopup = $ionicPopup.alert({
                title: '<h4>改变订餐开始时间成功</h4>',
                template: message
              });

              alertPopup.then(function (res) {
                $scope.menus[$scope.tab - 1].dinner.start_time = angular.copy(newDate);
                $scope.closeChangeStartTime();
              });
            }
          }, function (response) {
            var message = '<div><p>连接服务器失败</p></div>';

            var alertPopup = $ionicPopup.alert({
              title: '<h4>改变订餐开始时间失败</h4>',
              template: message
            });

            alertPopup.then(function (res) {

            });
          }
        );
      };

      // 修改结束时间
      $ionicModal.fromTemplateUrl('templates/admin/changeendtime.html', {
        scope: $scope
      }).then(function (modal) {
        $scope.changeEndTimeModal = modal
      });
      $scope.closeChangeEndTime = function () {
        $scope.changeEndTimeModal.hide();
      };
      $scope.changeEndTime = function () {
        $scope.timeData.endTime = new Date(angular.copy($scope.menus[$scope.tab - 1].dinner.end_time));
        $scope.changeEndTimeModal.show();
      };
      $scope.doChangeEndTime = function () {
        var time = $scope.timeData.endTime;
        var newDate = time.toTimeString().split(' ')[0];
        dinnerFactory.update({
          id: $scope.tab
        }, {
          end_time: newDate
        }).$promise.then(
          function (response) {
            if (response.type == 'fail') {
              var message = '<div><p>' + response.msg + '</p></div>';

              var alertPopup = $ionicPopup.alert({
                title: '<h4>改变订餐结束时间失败</h4>',
                template: message
              });

              alertPopup.then(function (res) {

              });
            } else {
              var message = '<div><p>改变订餐结束时间成功</p></div>';

              var alertPopup = $ionicPopup.alert({
                title: '<h4>改变订餐结束时间成功</h4>',
                template: message
              });

              alertPopup.then(function (res) {
                $scope.menus[$scope.tab - 1].dinner.end_time = angular.copy(newDate);
                $scope.closeChangeEndTime();
              });
            }
          }, function (response) {
            var message = '<div><p>连接服务器失败</p></div>';

            var alertPopup = $ionicPopup.alert({
              title: '<h4>改变订餐结束时间失败</h4>',
              template: message
            });

            alertPopup.then(function (res) {

            });
          }
        );
      };

      // 开关订餐状态
      $scope.toggleState = function (state) {
        if (state == 0) {
          dinnerFactory.update({
            id : $scope.tab
          }, {
            state : 1
          }).$promise.then(
            function (response) {
              if (response.type == 'fail') {
                var message = '<div><p>' + response.msg + '</p></div>';

                var alertPopup = $ionicPopup.alert({
                  title: '<h4>改变订餐状态失败</h4>',
                  template: message
                });

                alertPopup.then(function (res) {

                });
              } else {
                var message = '<div><p>改变订餐状态成功</p></div>';

                var alertPopup = $ionicPopup.alert({
                  title: '<h4>改变订餐状态成功</h4>',
                  template: message
                });

                alertPopup.then(function (res) {
                  $scope.menus[$scope.tab - 1].dinner.state = 1;
                });
              }
            }, function (response) {
              var message = '<div><p>连接服务器失败</p></div>';

              var alertPopup = $ionicPopup.alert({
                title: '<h4>改变订餐状态失败</h4>',
                template: message
              });

              alertPopup.then(function (res) {

              });
            }
          );
        } else {
          dinnerFactory.update({
            id: $scope.tab
          }, {
            state: 0
          }).$promise.then(
            function (response) {
              if (response.type == 'fail') {
                var message = '<div><p>' + response.msg + '</p></div>';

                var alertPopup = $ionicPopup.alert({
                  title: '<h4>改变订餐状态失败</h4>',
                  template: message
                });

                alertPopup.then(function (res) {

                });
              } else {
                var message = '<div><p>改变订餐状态成功</p></div>';

                var alertPopup = $ionicPopup.alert({
                  title: '<h4>改变订餐状态成功</h4>',
                  template: message
                });

                alertPopup.then(function (res) {
                  $scope.menus[$scope.tab - 1].dinner.state = 0;
                });

              }
            }, function (response) {
              var message = '<div><p>连接服务器失败</p></div>';

              var alertPopup = $ionicPopup.alert({
                title: '<h4>改变订餐状态失败</h4>',
                template: message
              });

              alertPopup.then(function (res) {

              });
            }
          );
        }
      };

      // 编辑菜品
      $scope.editDishData = {};
      $scope.degreeData = [
        {
          label : '一星',
          value : 1
        }, {
          label : '二星',
          value : 2
        }, {
          label : '三星',
          value : 3
        }, {
          label : '四星',
          value : 4
        }, {
          label : '五星',
          value : 5
        }
      ];
      $ionicModal.fromTemplateUrl('templates/admin/editDish.html', {
        scope: $scope
      }).then(function (modal) {
        $scope.editDishModal = modal
      });
      $scope.closeEditDish = function () {
        $scope.editDishModal.hide();
      };
      $scope.showEditDish = function (index) {
        $scope.editDishIndex = index;
        $scope.editDishData = angular.copy($scope.menus[$scope.tab - 1].dishes[index]);
        $scope.editDishModal.show();
      };
      $scope.doEditDish = function () {
        dishFactory.update({
          id : $scope.editDishData.id
        }, {
          name : $scope.editDishData.name,
          peppery_degree : $scope.editDishData.peppery_degree,
          description : $scope.editDishData.description
        }).$promise.then(
          function (response) {
            if (response.type == 'fail') {
              var message = '<div><p>' + response.msg + '</p></div>';

              var alertPopup = $ionicPopup.alert({
                title: '<h4>编辑菜品信息失败</h4>',
                template: message
              });

              alertPopup.then(function (res) {

              });
            } else {
              var message = '<div><p>编辑菜品成功</p></div>';

              var alertPopup = $ionicPopup.alert({
                title: '<h4>编辑菜品成功</h4>',
                template: message
              });

              alertPopup.then(function (res) {
                $scope.menus[$scope.tab - 1].dishes[$scope.editDishIndex] = angular.copy($scope.editDishData);
                $scope.editDishData = {};
                $scope.closeEditDish();
              });
            }
          }, function (response) {
            var message = '<div><p>连接服务器失败</p></div>';

            var alertPopup = $ionicPopup.alert({
              title: '<h4>编辑菜品成功</h4>',
              template: message
            });

            alertPopup.then(function (res) {
            });
          }
        );
      };

      //删除菜品
      $scope.showDeleteDish = function (index) {
        $scope.deleteDish = $scope.menus[$scope.tab - 1].dishes[index];
        var myPopup = $ionicPopup.show({
          template: '将会删除菜品-' + $scope.deleteDish.name,
          title: '删除菜品',
          scope: $scope,
          buttons: [
            { text: '取消' },
            {
              text: '<b>删除</b>',
              type: 'button-positive',
              onTap: function(e) {
                dishFactory.delete({
                  id : $scope.deleteDish.id
                }).$promise.then(
                  function (response) {
                    if (response.type == 'fail') {
                      var message = '<div><p>' + response.msg + '</p></div>';

                      var alertPopup = $ionicPopup.alert({
                        title: '<h4>删除菜品失败</h4>',
                        template: message
                      });

                      alertPopup.then(function (res) {

                      });
                    } else if (response.type == 'success') {
                      $scope.menus[$scope.tab - 1].dishes.splice(index, 1);

                      var message = '<div><p>删除菜品成功</p></div>';

                      var alertPopup = $ionicPopup.alert({
                        title: '<h4>删除菜品成功</h4>',
                        template: message
                      });

                      alertPopup.then(function (res) {

                      });

                    }
                  }, function (response) {
                    var message = '<div><p>连接服务器失败</p></div>';

                    var alertPopup = $ionicPopup.alert({
                      title: '<h4>删除菜品失败</h4>',
                      template: message
                    });

                    alertPopup.then(function (res) {

                    });
                  }
                );
              }
            }
          ]
        });
      };

      // 添加菜品
      $scope.addDishData = {};
      $ionicModal.fromTemplateUrl('templates/admin/addDish.html', {
        scope: $scope
      }).then(function (modal) {
        $scope.addDishModal = modal
      });
      $scope.closeAddDish = function () {
        $scope.addDishModal.hide();
      };
      $scope.showAddDish = function () {
        $scope.addDishModal.show();
      };
      $scope.doAddDish = function () {
        dishFactory.save({},{
          name : $scope.addDishData.name,
          peppery_degree : $scope.addDishData.peppery_degree,
          description : $scope.addDishData.description,
          menu_id : $scope.tab
        }).$promise.then(
          function (response) {
            if (response.type == 'fail') {
              var message = '<div><p>' + response.msg + '</p></div>';

              var alertPopup = $ionicPopup.alert({
                title: '<h4>新建菜品信息失败</h4>',
                template: message
              });

              alertPopup.then(function (res) {

              });
            } else {
              var message = '<div><p>新建菜品成功</p></div>';

              var alertPopup = $ionicPopup.alert({
                title: '<h4>新建菜品成功</h4>',
                template: message
              });

              alertPopup.then(function (res) {
                $scope.menus[$scope.tab - 1].dishes.push(angular.copy($scope.addDishData));
                $scope.addDishData = {};
                $scope.closeAddDish();
              });
            }
          }, function (response) {
            var message = '<div><p>连接服务器失败</p></div>';

            var alertPopup = $ionicPopup.alert({
              title: '<h4>新建菜品成功</h4>',
              template: message
            });

            alertPopup.then(function (res) {
            });
          }
        );
      };
    }])

  // 订单历史与管理
  .controller('AdminOrdersController', ['$scope', 'AuthFactory', 'orders', '$ionicModal', 'orderFactory', function ($scope, AuthFactory, orders, $ionicModal, orderFactory) {
    // middleware
    AuthFactory.middleware();
    // init
    $scope.orders = orders;
    $scope.search = {};
    $scope.searchDate = {};
    $scope.orderOrders = [
      {
        'label': '早餐',
        'value': '1'
      }, {
        'label': '午餐',
        'value': '2'
      }, {
        'label': '晚餐',
        'value': '3'
      }
    ];
    // 下拉刷新
    $scope.doRefresh = function () {
      console.log('Refreshing!');
      orderFactory.query().$promise.then(
        function (response) {
          $scope.orders = response;
          $scope.search = {};
          $scope.$broadcast('scroll.refreshComplete');
        },
        function (response) {

        }
      )
    };
    // 搜索
    $ionicModal.fromTemplateUrl('templates/admin/searchorders.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.searchOrdersModal = modal
    });
    $scope.closeSearch = function () {
      $scope.searchOrdersModal.hide();
    };
    $scope.searchOrders = function () {
      $scope.searchOrdersModal.show();
    };
    $scope.doSearchOrders = function () {
      if ($scope.searchDate.hasOwnProperty('date') && typeof($scope.searchDate.date) != 'undefined' && $scope.searchDate.date != null) {
        var date = new Date(Date.parse($scope.searchDate.date));
        $scope.search.date = date.getFullYear() + '-' + ('0' + (date.getUTCMonth() + 1)).slice(-2) + '-' + date.getDate();
      } else {
        $scope.search.date = undefined;
      }
      $scope.closeSearch();
    };

  }])

  // 充值历史与管理
  .controller('AdminDepositsController', ['$scope', 'AuthFactory', 'deposits', '$ionicModal', 'depositFactory', function ($scope, AuthFactory, deposits, $ionicModal, depositFactory) {
    // middleware
    AuthFactory.middleware();
    // init
    $scope.deposits = deposits;
    $scope.search = {};
    $scope.searchDate = {};
    $scope.dipositMethods = [
      {
        'label': '管理员充值',
        'value': '0'
      }, {
        'label': '微信充值',
        'value': '1'
      }
    ];
    // 下拉刷新
    $scope.doRefresh = function () {
      console.log('Refreshing!');
      depositFactory.query().$promise.then(
        function (response) {
          $scope.deposits = response;
          $scope.search = {};
          $scope.$broadcast('scroll.refreshComplete');
        },
        function (response) {

        }
      )
    };
    // 搜索
    $ionicModal.fromTemplateUrl('templates/admin/searchdeposits.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.searchDepositsModal = modal
    });
    $scope.closeSearch = function () {
      $scope.searchDepositsModal.hide();
    };
    $scope.searchDeposits = function () {
      $scope.searchDepositsModal.show();
    };
    $scope.doSearchDeposits = function () {
      if ($scope.searchDate.hasOwnProperty('tempDate') && typeof($scope.searchDate.tempDate) != 'undefined' && $scope.searchDate.tempDate != null) {
        var date = new Date(Date.parse($scope.searchDate.tempDate));
        $scope.searchDate.date = date.getFullYear() + '-' + ('0' + (date.getUTCMonth() + 1)).slice(-2) + '-' + date.getDate();
      } else {
        $scope.searchDate.date = undefined;
      }
      $scope.closeSearch();
    }
  }]);
