'use strict';

/**
 * @ngdoc service
 * @name unleashApp.cardsService
 * @description
 * # cardsService
 * Methods related to adding or removing user cards.
 */
angular.module('unleashApp')
  .factory('cardsService', function ($window, FBURL, $q, $firebase) {
    var currentUser = null;
    var cards = null;
    var ref;

    var getCardsRef = function(ownerId) {
      return new $window.Firebase(FBURL).child('users').child(ownerId).child('cards');
    };

    /**
     * Check if given card already exists in user cards
     * @param data Card object
     * @returns {boolean}
     */
    var isCardIsAlreadyAdded = function(data) {
      return _.find(cards, { type: data.type, level: data.level }) ? true : false;
    };

    /**
     * Marks all comments in a given cards as read and removes them from users’ newComments object
     * @param {Object} card
     * @param {Object} newComments
     */
    var markAllCommentsAsRead = function(card, newComments) {
      var readComments = card.comments ? Object.keys(card.comments) : [];

      for (var prop in newComments) {
        if(_.isString(newComments[prop]) && _.contains(readComments, newComments[prop])) {
          delete newComments[prop];
        }
      }

      newComments.$save();
    };

    return {
      /**
       * Checks whether a list exists in a system
       * @param ownerId
       * @param cardId
       * @returns {Promise}
       */
      isCardRegistered: function(ownerId, cardId) {
        var cardsRef = getCardsRef(ownerId);

        return $q(function(resolve, reject) {
          cardsRef.once('value', function(snapshot) {
            if (snapshot.hasChild(cardId)) {
              resolve();
            } else {
              reject();
            }
          });
        });
      },

      /**
       * Pulls card details
       * If logged in user is an owner of the card, reset the unread count
       * @param params An object containing owner ID, current user ID and card ID
       * @returns {Promise} Card details
       */
      getCard: function(params) {
        var self = this;
        var ownerId = params.ownerId;
        var userId = params.userId;
        var cardId = params.cardId;

        var cardsRef = getCardsRef(ownerId);

        return $q(function(resolve, reject) {
          self.isCardRegistered(ownerId, cardId).then(function() {

            var card = $firebase(cardsRef.child(cardId)).$asObject();
            var newComments = $firebase(cardsRef.parent().child('newComments')).$asObject();

            card.$loaded().then(function (data) {
              // If current user is the card owner
              if (ownerId === userId) {
                // Save unread count
                card.unread = 0;
                card.$save();

                newComments.$loaded().then(function () {
                  markAllCommentsAsRead(card, newComments);

                  resolve(data);
                });
              }

              else {
                resolve(data);
              }
            });
          }, function() {
            reject();
          });
        });
      },

      /**
       * Pulls card comments
       * @param params An object containing owner ID and card ID
       * @returns {Promise} Card details
       */
      getComments: function(params) {
        var commentsRef = new $window.Firebase(FBURL).child('users').child(params.ownerId).child('cards').child(params.cardId);
        return $firebase(commentsRef).$asObject();
      },

      /**
       * List user cards
       * @returns {Promise} Promise containing user cards
       */
      listCards: function(uid) {
        ref = new $window.Firebase(FBURL).child('users').child(uid).child('cards');
        currentUser = uid;
        cards = $firebase(ref).$asArray();

        return cards.$loaded();
      },

      /**
       * Assign a given card to the user
       * @param card
       */
      add: function(card) {
        // Check if the UID is set
        if (!currentUser) {
          console.error('No user UID set!');
          return;
        }

        // Abandon if the card has been added already
        if (isCardIsAlreadyAdded(card)) {
          return;
        }

        // If all works OK
        cards.$add(card);
      },

      /**
       * Remove the given card from user cards
       * @param card
       */
      remove: function(card) {
        var index = cards.$indexFor(card.$id);

        cards.$remove(index);
      },

      /**
       * Reorder two given cards
       * @param ids {Array} Card IDs
       */
      reorder: function(ids) {
        var promises;

        if (ids.length !== 2) {
          return;
        }

        var getCard = function(id) {
          return $firebase(ref.child(id)).$asObject().$loaded();
        };

        var swapPriorities = function(cards) {
          var tmp = cards[0].$priority;

          cards[0].$priority = cards[1].$priority;
          cards[1].$priority = tmp;

          return $q.all([
            cards[0].$save(),
            cards[1].$save()
          ]);
        };

        promises = ids.map(getCard);
        return $q.all(promises).then(swapPriorities);
      },

      /**
       * Toggle 'achieved' state in the card
       * @param card
       * @returns {Promise} Resolved after the updated card has been stored in Firebase.
       */
      toggleAchieved: function(card) {
        return $q(function(resolve) {
          card.achieved = !card.achieved;

          card.$save().then(function() {
            resolve(card.achieved);
          });
        });
      },

      /**
       * Increments the number of unread comments
       * @param commentRef Firebase reference to the comment
       */
      incrementCommentCount: function(commentRef) {
        var ref = commentRef.parent().parent();

        var card = $firebase(ref).$asObject();
        var newComments = $firebase(ref.parent().parent().child('newComments'));

        // Increments unread comment count for a given card
        card.$loaded().then(function() {
          if (!card.unread || !_.isNumber(card.unread)) {
            card.unread = 1;
          }

          else {
            card.unread++;
          }

          card.$save();
        });

        // Push comment ID to an array of unread comments
        newComments.$push(commentRef.key());
      }
    };
  });
