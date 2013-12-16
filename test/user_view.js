/*jshint browser:true, node:false*/
/*global require, sinon*/

describe('UserView', function() {
  "use strict";

  var UserView = require('user-list/lib/user_view');
  var defaultTemplate = require('user-list/templates/user-template.html');

  var assert = window.assert;

  var _ = require('lodash');

  var sandbox;
  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('render', function() {

    var mockUserList;

    beforeEach(function() {
      mockUserList = {
        _userList: {
          querySelector: sinon.stub().returns(false)
        },
        _truncateLength: 0,
        _userCache: {
          getLocalUser: sinon.stub().returns({})
        },
        _avatars: {},
        _enableUserOptions: true
      };
    });

    it('renders the default template', function(done) {
      var userView = new UserView(mockUserList);
      sandbox.stub(userView, '_addLocalUserElement');
      var templateSpy = sandbox.spy(userView, '_userTemplate');
      userView.render({}, function() {
        assert.equal(
          templateSpy.returnValues[0].substr(0, 10),
          defaultTemplate.substr(0, 10)
        );
        done();
      });
    });

    it('renders a custom template', function(done) {
      var CUSTOM_TEMPLATE = '<div></div>';
      mockUserList._userTemplate = sandbox.spy(_.template(CUSTOM_TEMPLATE));
      var userView = new UserView(mockUserList);
      sandbox.stub(userView, '_addLocalUserElement');
      userView.render({}, function() {
        assert.equal(mockUserList._userTemplate.returnValues[0], CUSTOM_TEMPLATE);
        done();
      });
    });
  });
});
