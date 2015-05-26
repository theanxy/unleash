'use strict';

/**
 * @ngdoc service
 * @name unleashApp.cardsService
 * @description
 * # cardsService
 * Methods related to adding or removing user cards.
 */
angular.module('unleashApp')
  .factory('cardsService', function ($window, FBURL, $firebaseObject, $firebaseArray, $q) {
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

    var moveCard = function (id, index) {
      ref.child(id).child('order').set(index);
    };

    var cardsService = {
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

            var card = $firebaseObject(cardsRef.child(cardId));
            var newComments = $firebaseObject(cardsRef.parent().child('newComments'));

            card.$loaded().then(function (data) {
              // If current user is the card owner
              if (ownerId === userId) {
                // Save unread count
                cardsRef.child(cardId).child('unread').set(0);

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
        return $firebaseObject(commentsRef);
      },

      /**
       * List user cards
       * @returns {Promise} Promise containing user cards
       */
      listCards: function(uid) {
        ref = new $window.Firebase(FBURL).child('users').child(uid).child('cards');
        currentUser = uid;
        cards = $firebaseArray(ref.orderByChild('order'));

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

        // Update card order
        if (card.order <= cards.length) {
          cardsService.reorder(card.order);
        }

        // If all works OK
        cards.$add(card);
      },

      /**
       * Remove the given card from user cards
       * @param _card
       */
      remove: function(_card) {
        var index = cards.$indexFor(_card.$id);

        cards.$remove(index).then(function() {
          angular.forEach(cards, function(card) {
            if (card.order > index) {
              cardsService.moveLeft(card);
            }
          });
        });
      },

      /**
       * Reorder cards when adding a new card
       * @param id index to start with
       */
      reorder: function(index) {
        angular.forEach(cards, function(card) {
          if (card.order >= index) {
            cardsService.moveRight(card);
          }
        });
      },

      moveRight: function (card) {
        moveCard(card.$id, card.order + 1);
      },
      moveLeft: function (card) {
        moveCard(card.$id, card.order - 1);
      },

      /**
       * Move existing cards, change their order
       * @param _card {Object} card that was moved
       * @param index new index of moved card
       */
      move: function(_card, index) {
        if (_card.order !== index) {
          // When decreasing the card order
          if (_card.order > index) {
            index = index + 1;
          }
          angular.forEach(cards, function(card) {
            if (card.order > _card.order && card.order <= index) {
              cardsService.moveLeft(card);
            } else if (card.order < _card.order && card.order >= index) {
              cardsService.moveRight(card);
            }
          });
          // Finally, update the order of changed card
          moveCard(_card.$id, index);
        }
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

        var card = $firebaseObject(ref);
        var newComments = ref.parent().parent().child('newComments');

        // Increments unread comment count for a given card
        card.$loaded().then(function() {
          var unread = 1;

          if (card.unread && _.isNumber(card.unread)) {
            unread = card.unread + 1;
          }

          ref.child('unread').set(unread);
        });

        // Push comment ID to an array of unread comments
        newComments.push(commentRef.key());
      }
    };

    return cardsService;
  });
