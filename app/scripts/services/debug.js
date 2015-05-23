'use strict';

/**
 * @ngdoc service
 * @name unleashApp.cardsService
 * @description
 * # cardsService
 * Methods related to adding or removing user cards.
 */
angular.module('unleashApp')
  .factory('debugService', function ($window, FBURL, $firebaseObject) {
    var ref = new $window.Firebase(FBURL).child('users');

    var applyOrder = function(owner, card, counter) {
      var obj = $firebaseObject(ref.child(owner).child('cards').child(card));

      obj.$loaded().then(function(data) {
        data.order = counter;
        data.$save();
      });
    };

    var processUserCards = function(user) {
      if (!user || !user.cards) {
        return;
      }

      var cards = _.keys(user.cards);
      var counter = 0;

      _.forEach(cards, function(card) {
        counter++;
        applyOrder(user.uid, card, counter);
      });
    };

    return {
      fixCardsOrder: function() {
        var users = $firebaseObject(ref);

        users.$loaded().then(function(data) {
          _.forEach(data, function(user) {
            processUserCards(user);
          });
        });
      }
    };
  });
