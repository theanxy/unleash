'use strict';

/**
 * @ngdoc directive
 * @name unleashApp.directive:unleashTemplateEdit
 * @description
 * # unleashTemplateEdit
 */
angular.module('unleashApp')
  .directive('unleashTemplateEdit', function (templatesService) {
    var getTemplateData = function(template) {
      return {
        'type': template.type,
        'level': template.level || '',
        'task': template.task || '',
        'icon': template.icon || ''
      };
    };

    var cloneTemplateProps = function(scope) {
      scope.updated = {};

      ['type', 'level', 'task', 'icon'].forEach(function(prop) {
        scope.updated[prop] = scope.template[prop];
      });
    };

    var save = function(id, data, element) {
      var template = getTemplateData(data);
      templatesService.update(id, template, function () {
        element.closest('li').removeClass('edit').addClass('view');
        element.remove();
      });
    };

    var remove = function(id) {
      templatesService.removeStored(id);
    };

    return {
      templateUrl: 'views/partials/templateEdit.html',
      controller: function editController($scope) {
        cloneTemplateProps($scope);
      },
      link: function editLink(scope, element, attrs) {
        scope.save = function() {
          save(attrs.id, scope.updated, element);
        };

        scope.remove = function() {
          remove(attrs.id);
        };
      },
      transclude: true
    };
  });
