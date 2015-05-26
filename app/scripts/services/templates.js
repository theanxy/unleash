'use strict';

/**
 * @ngdoc service
 * @name unleashApp.templatesService
 * @description
 * # templatesService
 * Methods related to adding or removing user templates.
 */
angular.module('unleashApp')
  .factory('templatesService', function($window, $q, $http, $firebaseArray, FBURL, cardsService, dataPath) {
    var ref = new $window.Firebase(FBURL).child('templates');
    var templateList = null;
    var templates = {};

    templates.new = [];

    templates.stored = ref.orderByChild('type');

    /**
     * Populate a predefined set of templates to the database
     * @returns {Promise} A reference to the Firebase object
     */
    var populateTemplates = function() {
      return $q(function() {
        $http.get(dataPath + 'templates.json').then(function(obj) {
          return templates.stored.set(obj.data);
        }).catch(function() {
          console.error('There was a problem loading the templates data file.');
        });
      });
    };

    return {
      /**
       * Synchronize new templates
       */
      newTemplates: templates.new,

      /**
       * List initial templates
       */
      list: $q(function(resolve) {
        templateList = $firebaseArray(templates.stored);

        templateList.$loaded().then(function() {
          if (templateList.length) {
            resolve(templateList);
          }

          else {
            // No templates stored in Firebase, instantiate
            return populateTemplates();
          }

        });
      }),

      /**
       * Add a new template
       * @param data Template data
       * @returns {Promise}
       */
      add: function(data) {
        var defer = $q.defer();

        if (!data || !data.type) {
          defer.reject(new Error('No template data given.'));
        } else {
          var template = {
            'type': data.type,
            'task': data.task || '',
            'level': data.level || '',
            'icon': data.icon || ''
          };
          templateList.$add(template).then(function () {
            defer.resolve();
          });
        }

        return defer.promise;
      },

      /**
       * Update template details with new data
       * @param id Template ID
       * @param data New data
       * @returns {Promise} Resolved once data has been stored in Firebase
       */
      update: function(id, data, onComplete) {
        var template = ref.child(id);

        return template.update(data, onComplete);
      },

      /**
       * Remove a given unsaved template
       * @param eq
       */
      removeNew: function(eq) {
        templates.new.splice(eq, 1);
      },

      /**
       * Remove a given stored template
       * @param id ID of stored template
       * @returns {Promise}
       */
      removeStored: function(id) {
        var index = templateList.$indexFor(id);

        return templateList.$remove(index);
      }
    };
  });

