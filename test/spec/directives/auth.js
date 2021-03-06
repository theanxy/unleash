'use strict';

var clickElement = function (el){
  var ev = document.createEvent('MouseEvent');
  ev.initMouseEvent(
    'click',
    true, true
  );
  el.dispatchEvent(ev);
};

describe('Directive: unleashAuth', function () {
  var element;
  var mySpy;
  var outerScope;
  var innerScope;

  beforeEach(module('unleashApp'));
  beforeEach(module('views/home.html'));
  beforeEach(module('views/partials/auth.html'));

  beforeEach(inject(function($rootScope, $compile) {
    element = angular.element('<unleash-auth></unleash-auth>');

    outerScope = $rootScope;
    $compile(element)(outerScope);

    innerScope = element.isolateScope();

    outerScope.$digest();
  }));

  describe('sign in button', function() {
    beforeEach(function() {
      mySpy = sinon.spy();

      outerScope.login = mySpy;
      outerScope.$apply();
    });

    it('should be rendered', function() {
      expect(element[0].children[0].innerHTML).to.contain('Sign in with Google');
    });

    it('should trigger a click event', function() {
      clickElement(element[0].children(0));
      expect(mySpy.callCount).to.equal(1);
    });
  });

  describe('welcome text', function() {
    var name = 'John Doe';

    beforeEach(function() {
      outerScope.user = {};
      outerScope.user.google = {};
      outerScope.user.google.displayName = name;
      outerScope.$apply();
    });

    it('should display a full name', function() {
      expect(element[0].children[0].innerHTML).to.contain(name);
    });
  });

  describe('sign out button', function() {
    beforeEach(function() {
      mySpy = sinon.spy();

      outerScope.user = {};
      outerScope.logout = mySpy;
      outerScope.$apply();
    });

    it('should be rendered', function() {
      expect(element[0].children[0].innerHTML).to.contain('Logout');
    });

    it('should trigger a click event', function() {
      clickElement(element[0].children(0).children[1]);
      expect(mySpy.callCount).to.equal(1);
    });
  });
});
