'use strict';

/**
 * @ngdoc overview
 * @name unleashApp
 * @description
 * # unleashApp
 *
 * Main module of the application.
 */
angular.module('unleashApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngTouch',
    'ngSanitize',
    'ngAria',
    'ngDraggable',
    'relativeDate',
    'angular-growl',
    'firebase',
    'firebase.utils'
  ])

.config(function($sceDelegateProvider) {
    // Allow loading thumbnails from Google+ in directives
    $sceDelegateProvider.resourceUrlWhitelist([
      'self',
      'https://*.googleusercontent.com/**'
    ]);
  })

.config(function(growlProvider) {
    growlProvider.globalTimeToLive(3000);
    growlProvider.globalDisableCountDown(true);
    growlProvider.globalDisableCloseButton(true);
    growlProvider.globalInlineMessages(true);
  })

.run(function($rootScope, $route, fbutil, Auth, userService) {
    $rootScope.user = {};
    $rootScope.allUsers = fbutil.syncArray('users');

    var setUserData = function() {
      $rootScope.user = Auth.$getAuth();

      if (!$rootScope.user) {
        return;
      }

      userService.getUserDetails().then(function(data) {
        if (!data.username) {
          return;
        }

        $rootScope.user.username = data.username;
        $rootScope.user.isAdmin = data.isAdmin;
      });
    };

    setUserData();

    $rootScope.$on('auth-change', function() {
      setUserData();
    });

    $rootScope.$on('$routeChangeSuccess', function(newVal, oldVal) {
      if (oldVal !== newVal) {
        $rootScope.routeClassName = 'page-' + $route.current.className;
      }
    });
  });
