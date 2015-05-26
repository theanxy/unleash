/**
 * @ngdoc function
 * @name unleashApp.controller:EditPathController
 * @todo Implement thee-way data binding to fully remove flickering
 * @description
 * # EditPathController
 * Controls data for the /account page
 */

'use strict';
angular.module('unleashApp')
  .controller('EditPathController', function ($window, $rootScope, $scope, $location, FBURL, fbutil, $routeParams, growl, templatesService, cardsService, userService) {
    $scope.params = $routeParams;
    $scope.cards = null;
    $scope.templates = {};

    if (!$rootScope.user.isAdmin) {
      growl.error('You are not authorized to see this page!');

      $location.path('/');
    }

    var setupPath = function(uid) {
      // List cards that user has been assigned with
      cardsService.listCards(uid).then(function(cards) {
        $scope.cards = cards;

        getTemplates();
      }).catch(function(error) {
        console.error(error);
      });
    };

    // List templates that are still available to use for the current user
    var getTemplates = function() {
      templatesService.list.then(function(templates) {
        $scope.templates.available = templates;
      }).catch(function(error) {
        console.error(error);
      });
    };

    // Setup the page after we get the UID of the username in the URL
    userService.getUserUid($routeParams.userId).then(function(uid) {
      $scope.currentUser = uid;

      // Pull user data
      $scope.currentPathOwner = fbutil.syncObject('users/' + uid);

      // Initialize the path
      setupPath(uid);
    });

    // Get initial templates
    templatesService.list.then(function(templates) {
      $scope.templates.initial = templates;
    }).catch(function(error) {
      growl.error(error);
    });

    // Handle drag and drop interface
    $scope.dropCard = function(event, index, card, external, type) {

      if (type === 'template') {
        card.order = index + 1;
        cardsService.add(card);
      }

      if (type === 'card') {
        cardsService.move(card, index);
      }

      return false;
    };

    // @todo Temporary fix to remove available cards flickering
    $scope.removeAvailable = function(index) {
      $scope.templates.available.splice(index, 1);
    };

    // Remove specific card from user cards
    $scope.remove = function(event, index, card, external, type) {
      if (type === 'card') {
        cardsService.remove(card);
      }
      return false;
    };
  });
