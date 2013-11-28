/*jshint browser:true*/
/*global module, require*/

'use strict';

/**
 * @fileoverview
 * @module goinstant/components/user-list
 * @exports userListComponent
 */

/** Module dependencies */
var classes = require('classes');
var prevent = require('prevent');
var binder = require('binder');
var async = require('async');
var _ = require('lodash');

var UserView = require('./lib/user_view');
var CountView = require('./lib/count_view');
var UserCache = require('usercache');
var colors = require('colors-common');

var errors = require('./lib/errors');

/** Templates */
var listTemplate = require('./templates/list-template.html');

/** Constants */
var OVERRIDE_CLASS = 'gi-override';
var WRAPPER_CLASS = 'gi-userlist';
var INNER_CLASS = 'gi-inner';
var COLLAPSE_BTN_CLASS = 'gi-collapse';
var OPTIONS_OVERLAY_CLASS = 'gi-options';
var ANCHOR_CLASS = 'gi-anchor';
var RELATIVE_CLASS = 'gi-relative';
var ALIGN_LEFT_CLASS = 'gi-left';
var ALIGN_RIGHT_CLASS = 'gi-right';
var DATA_GOINSTANT_ID = 'data-goinstant-id';
var COLLAPSED_CLASS = 'gi-collapsed';
var NO_OPTIONS_CLASS = 'gi-no-options';
var COUNT_ONLY_CLASS = 'gi-count-only';

var ESCAPE = 27;
var ENTER = 13;
var TAB = 9;

/** Valid Opts */
var VALID_OPTIONS = ['room', 'collapsed', 'position', 'container',
                     'truncateLength', 'avatars', 'userOptions', 'countOnly'];

var VALID_POSITIONS = ['left', 'right'];

var DISPLAYNAME_REGEX = /\/displayName$/;
var AVATARURL_REGEX = /\/avatarUrl$/;

var defaultOpts = {
  room: null,
  collapsed: false,
  position: 'right',
  container: null,
  truncateLength: 10,
  avatars: true,
  userOptions: true
};

module.exports = UserList;

UserList._UserCache = UserCache;
UserList._UserView = UserView;
UserList._CountView = CountView;
UserList._binder = binder;

/**
 * @constructor
 */
 function UserList(opts) {
  if (!opts || !_.isPlainObject(opts)) {
    throw errors.create('UserList', 'INVALID_OPTIONS');
  }

  var optionsPassed = _.keys(opts);
  var optionsDifference = _.difference(optionsPassed, VALID_OPTIONS);

  if (optionsDifference.length) {
    throw errors.create('UserList', 'INVALID_ARGUMENT');
  }
  if (!opts.room || !_.isObject(opts.room)) {
    throw errors.create('UserList', 'INVALID_ROOM');
  }
  if (opts.collapsed && !_.isBoolean(opts.collapsed)) {
    throw errors.create('UserList', 'INVALID_COLLAPSED');
  }
  if (opts.container && !_.isElement(opts.container)) {
    throw errors.create('UserList', 'INVALID_CONTAINER');
  }
  if (opts.position && !_.contains(VALID_POSITIONS, opts.position)) {
    throw errors.create('UserList', 'INVALID_POSITION');
  }
  if (opts.truncateLength && !_.isNumber(opts.truncateLength)) {
    throw errors.create('UserList', 'INVALID_TRUNCATELENGTH');
  }
  if (opts.avatars && !_.isBoolean(opts.avatars)) {
    throw errors.create('UserList', 'INVALID_AVATARS');
  }
  if (opts.userOptions && !_.isBoolean(opts.userOptions)) {
    throw errors.create('UserList', 'INVALID_USEROPTIONS');
  }

  var validOpts = _.defaults(opts, defaultOpts);

  // Options
  this._room = validOpts.room;
  this._collapsed = validOpts.collapsed;
  this._enableUserOptions = validOpts.userOptions;
  this._position = validOpts.position;
  this._container = validOpts.container;
  this._truncateLength = validOpts.truncateLength;
  this._avatars = validOpts.avatars;

  this._countOnly = validOpts.countOnly;
  if (this._countOnly) {
    this._enableUserOptions = false;
  }

  // Elements
  this.el = null;

  this._userList = null;
  this._collapseBtn = null;
  this._optionsOverlay = null;
  this._optionsIcon = null;
  this._optionsInput = null;

  // Boolean State
  this._editing = false;
  this._isBound = false;

  this._userCache = new UserList._UserCache(this._room);

  _.bindAll(this, [
    '_handleLeaveEvent',
    '_handleCollapseToggle',
    '_clickEditUser',
    '_keydownOptionsInput',
    '_handleUserMeta',
    '_handleJoinEvent',
    '_renderList'
  ]);
}

UserList.prototype.initialize = function(cb) {
  if (!cb || !_.isFunction(cb)) {
    throw errors.create('initialize', 'INVALID_CALLBACK');
  }
  // Append markup
  this._append();

  var tasks = [
    _.bind(this._userCache.initialize, this._userCache),
    this._renderList
  ];

  var self = this;

  async.series(tasks, function(err) {
    if (err) {
      self.destroy(function() {
        // Ignore destroy errors here since we're erroring anyway.
        return cb(err);
      });

      return;
    }

    // Bind click event to collapse toggle.
    UserList._binder.on(self._collapseBtn, 'click', self._handleCollapseToggle);

    if (self._optionsOverlay) {
      UserList._binder.on(self._optionsIcon, 'click', self._clickEditUser);
      UserList._binder.on(self._optionsInput, 'keydown',
                          self._keydownOptionsInput);
    }

    // Listen for userCache events.
    self._userCache.on('join', self._handleJoinEvent);
    self._userCache.on('leave', self._handleLeaveEvent);
    self._userCache.on('change', self._handleUserMeta);

    self._isBound = true;

    return cb(null, self);
  });
};

UserList.prototype._append = function() {
  this.el = document.createElement('div');
  this.el.setAttribute('class', WRAPPER_CLASS + ' ' + OVERRIDE_CLASS);

  this.el.innerHTML = listTemplate;

  // Check to see if userOptions is enabled
  // TODO: we will also want to check to see if the local user is in the room
  // for the case where we display a userList before a user joins the room. This
  // would involve updating userCache#getLocalUser to return null if there
  // isn't a local user.

  var userOptions = this.el.querySelector('.' + OPTIONS_OVERLAY_CLASS);

  if (this._enableUserOptions) {
    this._optionsOverlay = userOptions;
    this._optionsIcon = this._optionsOverlay.children[0];
    this._optionsInput = this._optionsOverlay.children[1];

  } else {
    classes(this.el).add(NO_OPTIONS_CLASS);
    this.el.removeChild(userOptions);
  }

  if (this._countOnly) {
    classes(this.el).add(COUNT_ONLY_CLASS);
  }

  // Check if user passed a container and if so, append user list to it
  if (this._container) {
    this._container.appendChild(this.el);

    classes(this.el).add(RELATIVE_CLASS);

  } else {
    document.body.appendChild(this.el);

    classes(this.el).add(ANCHOR_CLASS);
  }

  this._userList = this.el.querySelector('.' + INNER_CLASS);
  this._collapseBtn = this.el.querySelector('.' + COLLAPSE_BTN_CLASS);

  // Check if user passed the option for collapsed on load
  this._collapse(this._collapsed);

  // Pass the position either default or user set as a class
  if (!this._container && this._position === 'right') {
    classes(this.el).add(ALIGN_RIGHT_CLASS);

  } else if (!this._container) {
    classes(this.el).add(ALIGN_LEFT_CLASS);
  }
};

UserList.prototype._renderList = function(cb) {
  var self = this;

  var users = this._userCache.getAll();

  if (this._countOnly) {
    var countView = new UserList._CountView(self);

    return countView.render(users.length, function() {
      self.el.style.display = 'block';
      cb();
    });
  }

  return async.each(
    users,

    function(user, next) {
      var userView = new UserList._UserView(self);

      userView.render(user, next);
    },

    function() {
      // userView rendering cannot fail
      self.el.style.display = 'block';

      return cb();
    }
  );
};

/**
 * @private
 */
UserList.prototype._handleLeaveEvent = function(user) {
  if (!this.el) {
    return;
  }

  var userEl = this._queryUser(user.id);

  if (userEl) {
    userEl.parentNode.removeChild(userEl);
  }
};

UserList.prototype._queryUser = function(userId) {
  var dataQuery = '[' + DATA_GOINSTANT_ID + '="' + userId + '"]';

  var userEl = this.el.querySelector(dataQuery);

  return userEl;
};

UserList.prototype._handleCollapseToggle = function() {
  this._collapse(!this._collapsed);
};

UserList.prototype._collapse = function(toggle) {
  var classList = classes(this.el);

  if (toggle) {
    classList.add(COLLAPSED_CLASS);
    this._collapsed = true;

    this._deactivateEditing();

  } else {
    classList.remove(COLLAPSED_CLASS);

    this._collapsed = false;
  }
};

UserList.prototype._keydownOptionsInput = function(event) {
  var self = this;

  switch (event.keyCode) {
    case ESCAPE:
      prevent(event);

      self._deactivateEditing();

      break;

    case ENTER:
    case TAB:
      prevent(event);

      self._submitNameChange(function(err) {
        if (err) {
          self._deactivateEditing();
        }
      });

      break;
  }
};

UserList.prototype._clickEditUser = function(event, cb) {

  prevent(event);

  var self = this;

  if (self._editing) {
    self._submitNameChange(function(err) {
      if (err) {
        self._deactivateEditing();
      }

      if (cb) {
        return cb();
      }
    });

  } else {
    self._activateEditing();

    if (cb) {
      return cb();
    }
  }
};

UserList.prototype._submitNameChange = function(cb) {
  var self = this;

  var localUser = self._userCache.getLocalUser();
  var name = _.escape(self._optionsInput.value);

  if (name === localUser.displayName) {
    this._deactivateEditing();
    return cb();
  }

  var userKey = self._userCache.getLocalUserKey();

  userKey.key('displayName').set(name, function(err) {
    if (err) {
      return cb(err);
    }

    return cb();
  });
};

UserList.prototype._activateEditing = function() {
  this._editing = true;

  var localUser = this._userCache.getLocalUser();
  this._optionsInput.value = localUser.displayName;

  classes(this.el).add('gi-editing');

  this._optionsInput.focus();
};

UserList.prototype._deactivateEditing = function() {
  this._editing = false;

  classes(this.el).remove('gi-editing');
};

UserList.prototype._handleUserMeta = function(user, keyName, cb) {
  // Ignore user properties that don't affect the user list.
  if (!colors.isUserProperty(keyName) && !DISPLAYNAME_REGEX.test(keyName) &&
      !AVATARURL_REGEX.test(keyName)) {
    return;
  }

  var userView = new UserList._UserView(this);

  var self = this;

  userView.render(user, function() {
    if (user.id == self._userCache.getLocalUser().id) {
      self._deactivateEditing();
    }

    if (cb) {
      return cb();
    }
  });
};

UserList.prototype._handleJoinEvent = function(user) {
  var userView = new UserList._UserView(this);
  userView.render(user, function() {

  });
};

UserList.prototype.destroy = function(cb) {
  if (!cb || !_.isFunction(cb)) {
    throw errors.create('destroy', 'INVALID_CALLBACK');
  }

  if (this._isBound) {
    this._userCache.off('join', this._handleJoinEvent);
    this._userCache.off('leave', this._handleLeaveEvent);
    this._userCache.off('change', this._handleUserMeta);

    UserList._binder.off(this._collapseBtn, 'click',
                         this._handleCollapseToggle);

    if (this._optionsOverlay) {
      UserList._binder.off(this._optionsIcon, 'click',
                           this._clickEditUser);

      UserList._binder.off(this._optionsInput, 'keydown',
                           this._keydownOptionsInput);
    }

    this._isBound = false;
  }

  if (this.el) {
    this.el.parentNode.removeChild(this.el);
    this.el = null;
  }

  this._userCache.destroy(cb);
};
