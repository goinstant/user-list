/*jshint browser:true, node:false*/
/*global require, sinon*/

describe('User-List Component', function() {
  "use strict";

  var assert = window.assert;

  var UserList = require('user-list');

  var fakeRoom;

  var testUserList;

  describe('constructor', function() {
    beforeEach(function() {
      fakeRoom = {};
    });

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
});
