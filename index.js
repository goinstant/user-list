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
var Binder = require('binder');
var async = require('async');
var _ = require('lodash');

var UserView = require('./lib/user_view');
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
var COLLAPSED_CLASS = 'collapsed';
var NO_OPTIONS_CLASS = 'gi-no-options';

var ENTER = 13;
var TAB = 9;

/** Valid Opts */
var VALID_OPTIONS = ['room', 'collapsed', 'position', 'container',
                     'truncateLength', 'avatars', 'userOptions'];

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

  this._room = validOpts.room;
  this._collapsed = validOpts.collapsed;
  this._enableUserOptions = validOpts.userOptions;
  this._optionsVisible = false;
  this._position = validOpts.position;
  this._container = validOpts.container;
  this._truncateLength = validOpts.truncateLength;
  this._avatars = validOpts.avatars;
  this._wrapper = null;
  this._userList = null;
  this._collapseBtn = null;
  this._optionsOverlay = null;
  this._optionsIcon = null;
  this._optionsInput = null;
  this._isBound = false;
  this._nameChange = false;

  this._userCache = new UserCache(this._room);

  _.bindAll(this, [
    '_handleLeaveEvent',
    '_handleCollapseToggle',
    '_setUserName',
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
    Binder.on(self._collapseBtn, 'click', self._handleCollapseToggle);

    if (self._optionsOverlay) {
      Binder.on(self._optionsIcon, 'click', self._setUserName);
      Binder.on(self._optionsInput, 'keydown', self._setUserName);
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
  this._wrapper = document.createElement('div');
  this._wrapper.setAttribute('class', WRAPPER_CLASS + ' ' + OVERRIDE_CLASS);

  this._wrapper.innerHTML = listTemplate;

  // Check to see if userOptions is enabled
  // TODO: we will also want to check to see if the local user is in the room
  // for the case where we display a userList before a user joins the room. This
  // would involve updating userCache#getLocalUser to return null if there
  // isn't a local user.

  var userOptions = this._wrapper.querySelector('.' + OPTIONS_OVERLAY_CLASS);

  if (this._enableUserOptions) {
    this._optionsOverlay = userOptions;
    this._optionsIcon = this._optionsOverlay.children[0];
    this._optionsInput = this._optionsOverlay.children[1];

  } else {
    classes(this._wrapper).add(NO_OPTIONS_CLASS);
    this._wrapper.removeChild(userOptions);
  }

  // Check if user passed a container and if so, append user list to it
  if (this._container) {
    this._container.appendChild(this._wrapper);

    classes(this._wrapper).add(RELATIVE_CLASS);

  } else {
    document.body.appendChild(this._wrapper);

    classes(this._wrapper).add(ANCHOR_CLASS);
  }

  this._userList = this._wrapper.querySelector('.' + INNER_CLASS);
  this._collapseBtn = this._wrapper.querySelector('.' + COLLAPSE_BTN_CLASS);

  // Check if user passed the option for collapsed on load
  this._collapse(this._collapsed);

  // Pass the position either default or user set as a class
  if (!this._container && this._position === 'right') {
    classes(this._wrapper).add(ALIGN_RIGHT_CLASS);

  } else if (!this._container) {
    classes(this._wrapper).add(ALIGN_LEFT_CLASS);
  }
};

UserList.prototype._renderList = function(cb) {
  var self = this;

  var users = this._userCache.getAll();

  return async.each(
    users,

    function(user, next) {
      var userView = new UserView(self);

      userView.render(user, next);
    },

    function(err) {
      if (err) {
        return cb(err);
      }

      self._wrapper.style.display = 'block';

      return cb();
    }
  );
};

/**
 * @private
 */
UserList.prototype._handleLeaveEvent = function(user) {
  if (!this._wrapper) {
    return;
  }

  var userEl = this._queryUser(user.id);

  if (userEl) {
    userEl.parentNode.removeChild(userEl);
  }
};

UserList.prototype._queryUser = function(userId) {
  var dataQuery = '[' + DATA_GOINSTANT_ID + '="' + userId + '"]';

  var userEl = this._wrapper.querySelector(dataQuery);

  return userEl;
};

UserList.prototype._handleCollapseToggle = function() {
  this._collapse(!this._collapsed);
};

UserList.prototype._collapse = function(toggle) {
  if (toggle) {
    classes(this._userList).add(COLLAPSED_CLASS);
    classes(this._collapseBtn).add(COLLAPSED_CLASS);

    if (this._optionsOverlay) {
      classes(this._optionsOverlay).add(COLLAPSED_CLASS);
    }
    this._collapsed = true;

  } else {
    classes(this._userList).remove(COLLAPSED_CLASS);
    classes(this._collapseBtn).remove(COLLAPSED_CLASS);

    if (this._optionsOverlay) {
      classes(this._optionsOverlay).remove(COLLAPSED_CLASS);
    }
    this._collapsed = false;
  }
};

UserList.prototype._setUserName = function(event) {
  // Only accept these
  var isValidKey = event.keyCode === ENTER || event.keyCode === TAB;
  var isValidClick = event.type === 'click';

  // Ignore other events
  if (!isValidKey && !isValidClick) {
    return;
  }

  var localUser = this._userCache.getLocalUser();

  // Open the options
  if (isValidClick && !this._optionsVisible) {
    classes(this._optionsOverlay).add('set');

    this._optionsInput.focus();
    this._optionsInput.value = localUser.displayName;
    this._optionsVisible = true;

    return;
  }

  var name = _.escape(this._optionsInput.value);

  if (name === localUser.displayName) {
     // Close the options
    classes(this._optionsOverlay).remove('set');
    this._optionsVisible = false;
    return;
  }

  var userKey = this._userCache.getLocalUserKey();

  var self = this;

  userKey.key('displayName').set(name, function(err) {
    self._optionsVisible = false;

    if (err) {
      // Close the options, name was not set
      classes(self._optionsOverlay).remove('set');
      return;
    }

    self._nameChange = true;
  });
};

UserList.prototype._handleUserMeta = function(user, keyName) {
  // Ignore user properties that don't affect the user list.
  if (!colors.isUserProperty(keyName) && !DISPLAYNAME_REGEX.test(keyName) &&
      !AVATARURL_REGEX.test(keyName)) {
    return;
  }

  var userView = new UserView(this);

  var self = this;

  userView.render(user, function(err) {
    if (err) {
      throw err;
    }

    // Hide the userOptions once the name change renders.
    if (self._nameChange) {
      classes(self._optionsOverlay).remove('set');
      self._nameChange = false;
    }
  });
};

UserList.prototype._handleJoinEvent = function(user) {
  var userView = new UserView(this);
  userView.render(user, function(err) {
    if (err) {
      throw err;
    }
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

    Binder.off(this._collapseBtn, 'click', this._handleCollapseToggle);
    this._isBound = false;
  }

  if (this._wrapper) {
    this._wrapper.parentNode.removeChild(this._wrapper);
    this._wrapper = null;
  }

  this._userCache.destroy(cb);
};
