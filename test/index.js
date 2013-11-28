/*jshint browser:true, node:false*/
/*global require, sinon*/

describe('User-List Component', function() {
  "use strict";

  var UserList = require('user-list');

  var assert = window.assert;

  var classes = require('classes');
  var _ = require('lodash');

  var testUserList;

  var sandbox;
  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  var userList;

  var fakeRoom;
  var fakeUsers;
  var fakeUserView;
  var fakeUserCache;
  var fakeLocalUser;
  var fakeLocalUserKey;
  var fakeDisplayNameKey;

  beforeEach(function() {
    fakeRoom = {};

    fakeUsers = [
      {
        displayName: 'Jose',
        id: 3
      },
      {}
    ];

    fakeLocalUser = fakeUsers[0];

    fakeDisplayNameKey = {
      set: sinon.stub().yields()
    };
    fakeLocalUserKey = {
      key: sinon.stub().withArgs('displayName').returns(fakeDisplayNameKey)
    };

    fakeUserCache = {
      initialize: sinon.stub().yields(),
      on: sinon.stub(),
      off: sinon.stub(),
      destroy: sinon.stub().yields(),
      getAll: sinon.stub().returns(fakeUsers),
      getLocalUser: sinon.stub().returns(fakeLocalUser),
      getLocalUserKey: sinon.stub().returns(fakeLocalUserKey)
    };

    fakeUserView = {
      render: sinon.stub().yields()
    };

    sandbox.stub(UserList, '_UserCache').returns(fakeUserCache);
    sandbox.stub(UserList, '_UserView').returns(fakeUserView);
    sandbox.spy(UserList._binder, 'on');
    sandbox.spy(UserList._binder, 'off');
  });

  describe('constructor', function() {

    it('returns new instance object correctly', function() {
      var options = {
        room: fakeRoom
      };

      testUserList = new UserList(options);
      testUserList._userCache.initialize = sinon.stub().yields();

      assert.isObject(testUserList);
    });

    describe('errors', function() {
      it('throws an error if options is not passed', function() {
        assert.exception(function() {
          testUserList = new UserList(null);
        }, 'UserList: Options was not found or invalid');
      });

      it('throws an error if options is not an object', function() {
        assert.exception(function() {
          testUserList = new UserList('hi');
        }, 'UserList: Options was not found or invalid');
      });

      it('throws an error if options.room is not passed', function() {
        assert.exception(function() {
          testUserList = new UserList({});
        }, 'UserList: Room was not found or invalid');
      });

      it('throws an error if options.room is not an object', function() {
        var options = {
          room: 'hi'
        };

        assert.exception(function() {
          testUserList = new UserList(options);
        }, 'UserList: Room was not found or invalid');
      });

      it('throws an error if invalid options are passed', function() {
        var invalidOptions = {
          room: fakeRoom,
          fake: 'value'
        };

        assert.exception(function() {
          testUserList = new UserList(invalidOptions);
        }, 'UserList: Invalid argument passed');
      });

      it('throws an error if collapsed is not a boolean', function() {
        var options = {
          room: fakeRoom,
          collapsed: 'True'
        };

        assert.exception(function() {
          testUserList = new UserList(options);
        }, 'UserList: collapsed value must be a boolean');
      });

      it('throws an error if container is not a DOM element', function() {
        var options = {
          room: fakeRoom,
          container: 'DOM ELEMENT'
        };

        assert.exception(function() {
          testUserList = new UserList(options);
        }, 'UserList: container must be a DOM element');
      });

      it('throws an error if position is not right || left', function() {
        var options = {
          room: fakeRoom,
          position: 'top'
        };

        assert.exception(function() {
          testUserList = new UserList(options);
        }, 'UserList: position can only be "right" or "left"');
      });

      it('throws an error if position is not a string', function() {
        var options = {
          room: fakeRoom,
          position: true
        };

        assert.exception(function() {
          testUserList = new UserList(options);
        }, 'UserList: position can only be "right" or "left"');
      });

      it('passes back an error if truncateLength is not a number', function() {
        var options = {
          room: fakeRoom,
          truncateLength: '10'
        };

        assert.exception(function() {
          testUserList = new UserList(options);
        }, 'UserList: truncateLength can only be a number');
      });

      it('passes back an error if avatars is not a boolean', function() {
        var options = {
          room: fakeRoom,
          avatars: 'true'
        };

        assert.exception(function() {
          testUserList = new UserList(options);
        }, 'UserList: avatars must be a boolean');
      });

      it('passes back an error if userOptions is not a boolean', function() {
        var options = {
          room: fakeRoom,
          userOptions: 'true'
        };

        assert.exception(function() {
          testUserList = new UserList(options);
        }, 'UserList: userOptions must be a boolean');
      });
    });
  });

  describe('initialize', function() {
    afterEach(function(done) {
      userList.destroy(function() {
        done();
      });
    });

    it('hides the options when disabled', function(done) {
      userList = new UserList({
        room: fakeRoom,
        userOptions: false
      });

      userList.initialize(function(err) {
        assert.ifError(err);

        assert.ok(classes(userList.el).has('gi-no-options'));

        done();
      });
    });

    it('uses a container and applies the relative class', function(done) {
      var container = document.createElement('div');

      userList = new UserList({
        room: fakeRoom,
        container: container
      });

      userList.initialize(function(err) {
        assert.ifError(err);

        assert.equal(userList.el, container.children[0]);
        assert.ok(classes(userList.el).has('gi-relative'));
        assert.notOk(classes(userList.el).has('gi-anchor'));

        done();
      });
    });

    it('only displays the number of users', function(done) {
      userList = new UserList({
        room: fakeRoom,
        countOnly: true
      });

      userList.initialize(function(err) {
        assert.ifError(err);

        assert.ok(classes(userList.el).has('gi-count-only'));
        assert.ok(classes(userList.el).has('gi-no-options'));

        done();
      });
    });

    it('positions on the right', function(done) {
      userList = new UserList({
        room: fakeRoom,
        position: 'right'
      });

      userList.initialize(function(err) {
        assert.ifError(err);

        assert.ok(classes(userList.el).has('gi-right'));

        done();
      });
    });

    it('positions on the left', function(done) {
      userList = new UserList({
        room: fakeRoom,
        position: 'left'
      });

      userList.initialize(function(err) {
        assert.ifError(err);

        assert.ok(classes(userList.el).has('gi-left'));

        done();
      });
    });

    it('collapses', function(done) {
      userList = new UserList({
        room: fakeRoom,
        collapsed: true
      });

      userList.initialize(function(err) {
        assert.ifError(err);

        assert.ok(classes(userList.el).has('gi-collapsed'));

        done();
      });
    });

    it('expands', function(done) {
      userList = new UserList({
        room: fakeRoom,
        collapsed: false
      });

      userList.initialize(function(err) {
        assert.ifError(err);

        assert.notOk(classes(userList.el).has('gi-collapsed'));

        done();
      });
    });

    describe('defaults', function() {
      beforeEach(function(done) {
        var options = {
          room: fakeRoom
        };

        userList = new UserList(options);
        userList.initialize(function(err) {
          assert.ifError(err);
          done();
        });
      });

      afterEach(function(done) {
        userList.destroy(function() {
          done();
        });
      });

      it('initializes and binds to the userCache', function() {
        sinon.assert.calledOnce(fakeUserCache.initialize);
        sinon.assert.calledWith(
          fakeUserCache.on,
          'join',
          userList._handleJoinEvent
        );

        sinon.assert.calledWith(
          fakeUserCache.on,
          'leave',
          userList._handleLeaveEvent
        );

        sinon.assert.calledWith(
          fakeUserCache.on,
          'change',
          userList._handleUserMeta
        );
      });

      it('binds to events for options', function() {
        sinon.assert.calledWith(
          UserList._binder.on,
          sinon.match({className: 'gi-collapse'}),
          'click',
          userList._handleCollapseToggle
        );

        sinon.assert.calledWith(
          UserList._binder.on,
          sinon.match({className: 'gi-icon'}),
          'click',
          userList._clickEditUser
        );

        sinon.assert.calledWith(
          UserList._binder.on,
          sinon.match({className: 'gi-set-name'}),
          'keydown',
          userList._keydownOptionsInput
        );
      });

      it('renders a view for each user', function() {
        sinon.assert.callCount(fakeUserView.render, fakeUsers.length);

        _.each(fakeUsers, function(u) {
          sinon.assert.calledWith(fakeUserView.render, u);
        });
      });

      it('is displayed properly', function() {
        assert.notOk(classes(userList.el).has('gi-no-options'));
        assert.ok(classes(userList.el).has('gi-anchor'));

        assert.include(document.body.children, userList.el);
      });
    });

    describe('destroy', function() {
      beforeEach(function(done) {
        userList.initialize(function(err) {
          assert.ifError(err);

          userList.destroy(function(err) {
            assert.ifError(err);

            done();
          });
        });
      });

      it('initializes and binds to the userCache', function() {
        sinon.assert.calledWith(
          userList._userCache.off,
          'join',
          userList._handleJoinEvent
        );

        sinon.assert.calledWith(
          userList._userCache.off,
          'leave',
          userList._handleLeaveEvent
        );

        sinon.assert.calledWith(
          userList._userCache.off,
          'change',
          userList._handleUserMeta
        );
      });

      it('binds to events for options', function() {
        sinon.assert.calledWith(
          UserList._binder.off,
          sinon.match({className: 'gi-collapse'}),
          'click',
          userList._handleCollapseToggle
        );

        sinon.assert.calledWith(
          UserList._binder.off,
          sinon.match({className: 'gi-icon'}),
          'click',
          userList._clickEditUser
        );

        sinon.assert.calledWith(
          UserList._binder.off,
          sinon.match({className: 'gi-set-name'}),
          'keydown',
          userList._keydownOptionsInput
        );
      });
    });
  });

  describe('user controls', function() {
    beforeEach(function(done) {
      var options = {
        room: fakeRoom
      };

      userList = new UserList(options);
      userList.initialize(function(err) {
        assert.ifError(err);
        done();
      });
    });

    afterEach(function(done) {
      userList.destroy(function() {
        done();
      });
    });

    it('toggles when collapse is clicked', function() {
      userList._handleCollapseToggle();

      assert.ok(classes(userList.el).has('gi-collapsed'));

      userList._handleCollapseToggle();

      assert.notOk(classes(userList.el).has('gi-collapsed'));
    });

    describe('editing your name', function() {
      it('toggles editing, and does not save when no change', function(done) {
        userList._clickEditUser({}, function() {
          assert.ok(classes(userList.el).has('gi-editing'));

          userList._clickEditUser({}, function() {
            assert.notOk(classes(userList.el).has('gi-editing'));

            sinon.assert.notCalled(fakeDisplayNameKey.set);

            done();
          });
        });
      });

      it('sets the new name when changed', function(done) {
        userList._clickEditUser({}, function() {
          assert.ok(classes(userList.el).has('gi-editing'));

          var input = userList.el.querySelector('input');
          input.value = 'cool';

          userList._clickEditUser({}, function() {
            sinon.assert.calledWith(fakeDisplayNameKey.set, 'cool');

            assert.ok(classes(userList.el).has('gi-editing'));


            // We wait until the change comes back to the local platform
            // listener before displaying it.
            var updatedFakeLocalUser = _.clone(fakeLocalUser);
            updatedFakeLocalUser.displayName = 'cool';

            var keyName =  '/.users/231232131232/displayName';

            userList._handleUserMeta(updatedFakeLocalUser, keyName, function() {
              assert.notOk(classes(userList.el).has('gi-editing'));

              sinon.assert.calledWith(
                fakeUserView.render,
                updatedFakeLocalUser
              );

              done();
            });
          });
        });

      });

      it('stops editing when collapse is clicked', function(done) {
        userList._clickEditUser({}, function() {
          assert.ok(classes(userList.el).has('gi-editing'));

          userList._handleCollapseToggle({});

          assert.notOk(classes(userList.el).has('gi-editing'));

          done();
        });
      });
    });
  });

  describe('users', function() {
    beforeEach(function(done) {
      var options = {
        room: fakeRoom
      };

      userList = new UserList(options);
      userList.initialize(function(err) {
        assert.ifError(err);

        fakeUserView.render.reset();

        done();
      });
    });

    afterEach(function(done) {
      userList.destroy(function() {
        done();
      });
    });

    it('are rendered when they join', function() {
      var user = {};
      userList._handleJoinEvent(user);

      sinon.assert.calledWith(fakeUserView.render, user);
    });

    it('are rendered when they change', function() {
      var user = {
        displayName: 'whatever'
      };

      userList._handleUserMeta(user, '/.users/awessdsdas/displayName');

      sinon.assert.calledWith(fakeUserView.render, user);
    });
  });
});
