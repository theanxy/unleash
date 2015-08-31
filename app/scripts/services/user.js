'use strict';

/**
 * @ngdoc service
 * @name unleashApp.userService
 * @description
 * # userService
 * Methods related to controlling user authentication.
 */
angular.module('unleashApp')
  .factory('userService', function($rootScope, $window, $location, FBURL, Auth, $compile, $q, growl) {
    var ref = new $window.Firebase(FBURL);

    /**
     * Check if user is already registered
     * @param callback
     */
    var checkIfUserExists = function(callback) {
      var queryRef = ref.child('users');

      queryRef.once('value', function(snapshot) {
        var storedUsers = snapshot.val() || {};
        var currentUser = Auth.$getAuth().uid;

        callback(currentUser in storedUsers);
      });
    };

    /**
     * Check if authenticated user’s email address is from x-team.com domain
     * @param data OAuth data
     * @returns {boolean}
     */
    var isFromXteam = function(data) {
      if (data) {
        var domain = '@x-team.com';
        var email = data.google.email || '';

        return email.indexOf(domain) !== -1;
      }
    };

    /**
     * Get username from a given email address
     * @param email
     * @returns {*}
     */
    var parseEmail = function(email) {
      return email.match(/^([^@]*)@/)[1];
    };

    return {
      /**
       * Add new user data to firebase
       * @param authData User data from OAuth
       */
      register: function(authData) {
        // @todo REMOVE ME! Debug-only
        //var isValidLogin = isFromXteam(authData);
        var isValidLogin = true;

        if (authData) {
          if (isValidLogin) {
            authData.username = parseEmail(authData.google.email);

            ref.child('users').child(authData.uid).set(authData);

            return true;
          } else {
            growl.error('Try using an x-team email address. Not registered.');

            this.logout({
              silent: true
            });
          }
        }
      },

      /**
       * Login using OAuth
       */
      login: function() {
        var self = this;

        // Login to google using a pop up
        ref.authWithOAuthPopup('google', function(err, authData) {
          if (err) {

            // If the pop up won’t fire, authenticate using a redirect
            if (err.code === 'TRANSPORT_UNAVAILABLE') {
              ref.authWithOAuthRedirect('google', function(err) {
                console.error('There was a problem logging in: ' + err);
              });

            } else {
              console.error('There was a problem logging in: ' + err);
            }
          }

          if(authData) {
            // User is logged in

            checkIfUserExists(function(doesExist) {
              if(!doesExist) {
                if(self.register(authData)) {
                  growl.success('Make yourself at home, ' + authData.google.displayName + '!');
                }
              } else {
                growl.success('Welcome back, ' + authData.google.displayName + '!');
              }
            });
          }
        }, {
          scope: 'email'
        });
      },

      /**
       * Actions related to logout
       */
      logout: function(options) {
        options = options || {};

        // @todo: add animations
        ref.unauth();

        if(!options.silent) {
          growl.success('Logged out successfully.');
        }

        $location.path('/');
      },

      /**
       * Returns an username and an account level for a given UID or for a currently signed in user
       * @param data
       * @returns {Promise} Username
       */
      getUserDetails: function(data) {
        var deferred = $q.defer();
        var uid;

        if(data || Auth.$getAuth()) {
          uid = data || Auth.$getAuth().uid;

          var queryRef = ref.child('users');

          queryRef.once('value', function (snapshot) {
            var storedUsers = snapshot.val() || {};

            if (Object.keys(storedUsers) && storedUsers[uid]) {
              deferred.resolve({
                email: storedUsers[uid].google.email,
                fullName: storedUsers[uid].google.displayName,
                picture: storedUsers[uid].google.cachedUserProfile.picture,
                username: storedUsers[uid].username,
                /*jshint camelcase: false */
                isAdmin: storedUsers[uid].is_admin
                /*jshint camelcase: true */
              });
            } else {
              deferred.reject(new Error('No user with uid:"' + uid + '" registered.'));
            }
          });
        }

        else {
          deferred.reject(new Error('No data provided.'));
        }

        return deferred.promise;
      },

      /**
       * Gets UID from an username
       * @param username
       * @returns {promise} UID
       */
      getUserUid: function(username) {
        return $q(function(resolve, reject) {
          var queryRef = ref.child('users');
          var users = {};

          queryRef.once('value', function (snapshot) {
            users.all = snapshot.val() || {};

            for (var uid in users.all) {
              if (users.all[uid].username === username) {
                users.current = uid;
              }
            }

            if(users.current) {
              resolve(users.current);
            } else {
              reject(Error('No uid for ' + username + ' found!'));
            }
          });
        });
      },

      /**
       * Broadcast changes in auth
       */
      listen: function() {
        ref.onAuth(function() {
          $rootScope.$broadcast('auth-change');
        });
      }
    };
  });
