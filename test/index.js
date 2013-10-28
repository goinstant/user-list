/*jshint browser:true, node:false*/
/*global require, sinon*/

describe('User-List Component', function() {
  "use strict";

  var assert = window.assert;
  var async = require('async');
  var _ = require('lodash');
  var $ = require('jquery');

  var UserList = require('user-list');
  var UserView = require('user-list/lib/user_view.js');

  var colors = require('colors-common');

  var fakeRoom;
  var fakeUser;
  var fakeUserKey;

  var fakeUsers;
  var fakeUsersKey;
  var fakeUserKeys;

  var testUserList;

  function createFakeKey(name) {
    return {
      name: name,
      get: sinon.stub().yields(),
      set: sinon.stub(),
      key: createFakeKey,
      remove: sinon.stub().yields(),
      on: sinon.stub().callsArg(2),
      off: sinon.stub().callsArg(2)
    };
  }

  beforeEach(function() {
    fakeRoom = {};
    fakeUser = {
      displayName: 'Guest 1',
      id: '1234'
    };
    fakeUser[colors.USER_PROPERTY] = '#FF0000';

    fakeUserKey = createFakeKey('guest1');
    fakeRoom.user = sinon.stub().yields(null, fakeUser, fakeUserKey);
    fakeRoom._platform = {
      _user: {
        id: fakeUser.id
      }
    };

    fakeUsers = {
      1234: {
        displayName: 'Guest 1',
        id: '1234'
      },
      5678: {
        displayName: 'Guest 2',
        id: '5678'
      }
    };

    fakeUserKeys = [
      createFakeKey(),
      createFakeKey()
    ];

    fakeUsersKey = createFakeKey('/.users');

    fakeRoom.users = sinon.stub().yields(null, fakeUsers, fakeUserKeys);
    fakeRoom.key = sinon.stub();
    fakeRoom.key.returns(createFakeKey());
    fakeRoom.key.withArgs('/.users').returns(fakeUsersKey);
    fakeRoom.on = sinon.stub().callsArg(2);
    fakeRoom.off = sinon.stub().callsArg(2);
    fakeRoom.users.on = sinon.stub().callsArg(2);
    fakeRoom.users.off = sinon.stub().callsArg(2);
  });

  describe('platform events', function() {
    beforeEach(function(done) {
      var options = {
        room: fakeRoom
      };

      testUserList = new UserList(options);

      testUserList.initialize(function(err) {
        if (err) {
          return done(err);
        }

        done();
      });
    });

    afterEach(function(done) {
      var el = document.querySelector('.gi-userlist');

      if (!testUserList || !el) {
        return done();
      }

      testUserList.destroy(function(err) {
        if (err) {
          return done(err);
        }

        testUserList = null;

        done();
      });
    });

    it('updates the users displayName when it is updated', function() {
      var updatedUser = {
        displayName: 'Duck',
        id: '1234',
        avatarColor: '#FF0000'
      };

      var keyName = '/.users/guest:1234/displayName';

      testUserList._userCache._emitter.emit('change', updatedUser, keyName);

      var query = '[data-goinstant-id="'+updatedUser.id+'"]';
      var el = document.querySelector(query);

      var displayName = el.querySelector('.gi-name span').innerHTML;

      assert.equal(displayName, updatedUser.displayName);
    });

    it('ignores user updates it doesnt care about', function() {
      var updatedUser = {
        displayName: 'Duck',
        id: '1234',
        avatarColor: '#FF0000',
        foo: 'bar'
      };

      var keyName = '/.users/guest:1234/foo';
      sinon.stub(UserView.prototype, 'render').yields();

      testUserList._userCache._emitter.emit('change', updatedUser, keyName);

      sinon.assert.notCalled(UserView.prototype.render);
      UserView.prototype.render.restore();
    });

    it('adds the user successfully on "join" event', function() {
      var listener = fakeRoom.on.args[1][1];

      listener(fakeUser);

      var el = document.querySelector('[data-goinstant-id="'+fakeUser.id+'"]');

      assert(el);
    });

    it('removes the user successfully on "leave" event', function() {
      var listener = fakeRoom.on.args[0][1];

      listener(fakeUser);

      var el = document.querySelector('[data-goinstant-id="'+fakeUser.id+'"]');

      assert(!el);
    });

    it('handles a user without a displayName', function() {
      var listener = fakeRoom.on.args[1][1];

      delete fakeUser.displayName;
      listener(fakeUser);

      var el = document.querySelector('[data-goinstant-id="'+fakeUser.id+'"]');

      assert(el);
    });

    it('handles a user with a non-string displayName', function() {
      var listener = fakeRoom.on.args[1][1];

      fakeUser.displayName = {};
      listener(fakeUser);

      var el = document.querySelector('[data-goinstant-id="'+fakeUser.id+'"]');

      assert(el);
    });

  });

  describe('truncate', function() {
    var testUserList;

    beforeEach(function(done) {
      var options = {
        room: fakeRoom,
        truncateLength: 3
      };

      testUserList = new UserList(options);

      testUserList.initialize(function(err) {
        if (err) {
          return done(err);
        }

        done();
      });
    });

    afterEach(function(done) {
      var el = document.querySelector('.gi-userlist');

      if (!testUserList || !el) {
        return done();
      }

      testUserList.destroy(function(err) {
        if (err) {
          return done(err);
        }

        testUserList = null;

        done();
      });
    });

    it('truncates overlaps with ...', function() {
      var els = document.querySelectorAll('.gi-name span');

      _.each(els, function(el) {
        assert.equal(el.innerHTML, "Gue...");
      });
    });
  });

  describe('truncate', function() {
    var testUserList;

    beforeEach(function(done) {
      var options = {
        room: fakeRoom,
        truncateLength: 5
      };

      testUserList = new UserList(options);

      testUserList.initialize(function(err) {
        if (err) {
          return done(err);
        }

        done();
      });
    });

    afterEach(function(done) {
      var el = document.querySelector('.gi-userlist');

      if (!testUserList || !el) {
        return done();
      }

      testUserList.destroy(function(err) {
        if (err) {
          return done(err);
        }

        testUserList = null;

        done();
      });
    });

    it('truncates after spaces without ellipse' , function() {
      var els = document.querySelectorAll('.gi-name span');

      _.each(els, function(el) {
        assert.equal(el.innerHTML, 'Guest');
      });
    });
  });

  describe('user view', function() {
    var testUserList;
    var testUserView;

    beforeEach(function(done) {
      var options = {
        room: fakeRoom
      };

      testUserList = new UserList(options);

      testUserList.initialize(function(err) {
        if (err) {
          return done(err);
        }

        testUserView = new UserView(testUserList);
        done();
      });
    });

    afterEach(function(done) {
      testUserList.destroy(function(err) {
        if (err) {
          return done(err);
        }

        done();
      });
    });

    it('orders users by displayName with the local user first', function(done) {
      var moreUsers = {
        3456: {
          displayName: 'Zombie',
          id: '3456'
        },
        7890: {
          displayName: 'Apple',
          id: '7890'
        },
        7891: {
          displayName: 'Apple',
          id: '7891'
        }
      };

      var sorted = ["guest 1", "apple", "apple", "guest 2", "zombie"];
      var ids = ["1234", "7890", "7891", "5678", "3456"];

      var tasks = [
        _.bind(testUserView.render, testUserView, fakeUsers['5678']),
        _.bind(testUserView.render, testUserView, moreUsers['7891']),
        _.bind(testUserView.render, testUserView, fakeUsers['1234']),
        _.bind(testUserView.render, testUserView, moreUsers['7890']),
        _.bind(testUserView.render, testUserView, moreUsers['3456'])
      ];

      async.series(tasks, function(err) {
        if (err) {
          return done(err);
        }

        var fakeList = $('.gi-inner').children();
        fakeList.each(function(index) {
          var userName = fakeList.eq(index).find('span').html().toLowerCase();
          var userId = fakeList.eq(index).attr('data-goinstant-id');
          if (userName !== sorted[index] || userId !== ids[index]) {
            return done(new Error('OUT OF ORDER AHH'));
          }
        });

        return done();
      });
    });

    it('does not add avatar to the user list if invalid img', function(done) {
      var fakeUser = fakeUsers['5678'];
      fakeUser.avatarUrl = 'IMGNOTFOUND404';

      testUserView.render(fakeUser, function() {

        var query = '[data-goinstant-id="'+fakeUser.id+'"]';
        var el = document.querySelector(query);
        var img = el.querySelector('.gi-avatar-image');

        assert(!img);
        done();
      });
    });

    it('adds an avatar to the user list', function(done) {
      // Give more time to load image
      this.timeout(10000);

      var fakeUser = fakeUsers['5678'];
      fakeUser.avatarUrl = 'https://si0.twimg.com/profile_images/1539812195/' +
                            '400x400-GoInstant_bigger.png';

      testUserView.render(fakeUser, function() {

        var query = '[data-goinstant-id="'+fakeUser.id+'"]';
        var el = document.querySelector(query);
        var img = el.querySelector('.gi-avatar-img');

        assert(img);
        done();
      });
    });
  });

  describe('change name', function() {
    var testUserList;
    var mockUserCache;

    beforeEach(function(done) {
      var options = {
        room: fakeRoom
      };

      testUserList = new UserList(options);

      testUserList.initialize(function(err) {
        if (err) {
          return done(err);
        }

        var fakeDisplayNameKey = createFakeKey('displayName');
        fakeUserKey.key = function() {
          return fakeDisplayNameKey;
        };

        mockUserCache = testUserList._userCache;
        mockUserCache.getUserKey = function() {
          return fakeUserKey;
        };

        done();
      });
    });

    afterEach(function(done) {
      testUserList.destroy(function(err) {
        if (err) {
          return done(err);
        }

        done();
      });
    });

    it('clicking the options button toggles name input', function() {
      var el = $('.gi-options');

      assert(el.children().eq(1).css('display') === 'none');

      el.children().eq(0).click();
      assert(el.children().eq(1).css('display') === 'block');

      el.children().eq(0).click();
      sinon.assert.notCalled(fakeUserKey.key().set);
      assert(el.children().eq(1).css('display') === 'none');
    });

    it('clicking the options button sets the displayName', function() {
      var el = $('.gi-options');

      el.children().eq(0).click();
      el.children().eq(1).val('Banana');

      el.children().eq(0).click();
      sinon.assert.calledOnce(fakeUserKey.key().set);
    });

    it('pressing enter sets the displayName', function() {
      var el = $('.gi-options');

      el.children().eq(0).click();
      el.children().eq(1).val('Banana');

      var fakeEvent = {
        type: 'keydown',
        keyCode: 13
      };

      testUserList._setUserName(fakeEvent);
      sinon.assert.calledOnce(fakeUserKey.key().set);
    });

    it('pressing tab sets the displayName', function() {
      var el = $('.gi-options');

      el.children().eq(0).click();
      el.children().eq(1).val('Banana');

      var fakeEvent = {
        type: 'keydown',
        keyCode: 9
      };

      testUserList._setUserName(fakeEvent);
      sinon.assert.calledOnce(fakeUserKey.key().set);
    });

    it('doesn\'t set the name if the name didn\'t change', function() {
      var el = $('.gi-options');

      el.children().eq(0).click();
      el.children().eq(1).val('Guest 1');

      var fakeEvent = {
        type: 'keydown',
        keyCode: 13
      };

      testUserList._setUserName(fakeEvent);
      sinon.assert.notCalled(fakeUserKey.key().set);
    });

    it('name doesn\'t change on displayName key set err', function() {
      var currentName = $('.gi-local-user span').text();

      var fakeErr = new Error('I\'m an error');
      fakeUserKey.key().set = sinon.stub().yields(fakeErr);

      var el = $('.gi-options');

      el.children().eq(0).click();
      el.children().eq(1).val('Banana');

      var fakeEvent = {
        type: 'keydown',
        keyCode: 13
      };

      testUserList._setUserName(fakeEvent);
      assert(el.children().eq(1).css('display') === 'none');
      assert($('.gi-local-user span').text() === currentName);
    });
  });

  describe('constructor', function() {
    afterEach(function(done) {
      var el = document.querySelector('.gi-userlist');

      if (!testUserList || !el) {
        return done();
      }

      testUserList.destroy(function(err) {
        if (err) {
          return done(err);
        }

        testUserList = null;

        done();
      });
    });

    it('returns new instance object correctly', function() {
      var options = {
        room: fakeRoom
      };

      testUserList = new UserList(options);

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

  describe('.initialize', function() {
    beforeEach(function() {
      var options = {
        room: fakeRoom
      };

      testUserList = new UserList(options);
    });

    afterEach(function(done) {
      var el = document.querySelector('.gi-userlist');

      if (!testUserList || !el) {
        return done();
      }

      testUserList.destroy(function(err) {
        if (err) {
          return done(err);
        }

        testUserList = null;

        done();
      });
    });

    it('successfully calls on initialize', function(done) {
      testUserList.initialize(function(err) {
        if (err) {
          return done(err);
        }

        done();
      });
    });

    it('renders the user list in the DOM', function(done) {
      testUserList.initialize(function(err) {
        if (err) {
          return done(err);
        }

        var container = document.querySelector('.gi-userlist');
        var inner = document.querySelector('.gi-inner');
        var collapseBtn = document.querySelector('.gi-collapse');

        assert(container);
        assert(inner);
        assert(collapseBtn);

        done();
      });
    });

    describe('errors', function() {
      it('throws an error if not passed a callback', function() {
        assert.exception(function() {
          testUserList.initialize();
        }, 'initialize: Callback was not found or invalid');
      });

      it('throws an error if passed callback is not a function', function() {
        assert.exception(function() {
          testUserList.initialize({});
        }, 'initialize: Callback was not found or invalid');
      });
    });
  });

  describe('.destroy', function() {
    beforeEach(function(done) {
      var options = {
        room: fakeRoom
      };

      testUserList = new UserList(options);

      testUserList.initialize(function(err) {
        if (err) {
          return done(err);
        }

        done();
      });
    });

    it('successfully calls destroy with no error returned', function(done) {
      testUserList.destroy(function(err) {
        if (err) {
          return done(err);
        }

        done();
      });
    });

    it('verifies room "leave" listener has been removed', function(done) {
      var fakeRoom = testUserList._room;
      var listener = fakeRoom.on.args[0][1];

      testUserList.destroy(function(err) {
        if (err) {
          return done(err);
        }

        assert(fakeRoom.off.calledWith('leave', listener));

        done();
      });
    });

    it('verifies room "join" listener has been removed', function(done) {
      var fakeRoom = testUserList._room;
      var listener = fakeRoom.on.args[1][1];

      testUserList.destroy(function(err) {
        if (err) {
          return done(err);
        }

        assert(fakeRoom.off.calledWith('join', listener));

        done();
      });
    });

    it('verifies users key "set" listener is removed', function(done) {
      testUserList.destroy(function(err) {
        if (err) {
          return done(err);
        }

        var listener = fakeUsersKey.on.args[0][1].listener;

        assert(fakeUsersKey.off.calledWith('set', listener));

        done();
      });
    });

    it('verifies user list container element doesn\'t exist', function(done) {
      testUserList.destroy(function(err) {
        if (err) {
          return done(err);
        }

        var container = document.querySelector('.gi-userlist');
        var inner = document.querySelector('.gi-inner');
        var collapseBtn = document.querySelector('.gi-collapse');

        assert(!container);
        assert(!inner);
        assert(!collapseBtn);

        done();
      });
    });
  });

});
