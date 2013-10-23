/*jshint browser:true*/
/*global module, require*/

'use strict';

/**
 * Module dependencies
 */

var classes = require('classes');
var _ = require('lodash');
var trim = require('trim');

var colors = require('colors');

/**
 * Templates
 */

var userTemplate = require('../templates/user-template.html');

/**
 * Constants
 */

var DATA_GOINSTANT_ID = 'data-goinstant-id';
var NO_OPTIONS_CLASS = 'gi-no-options';
var LOCAL_USER_CLASS = 'gi-local-user';

/**
 * Expose `userView`
 */

module.exports = UserView;

/**
 * @constructor
 */

function UserView(userList) {
  this._userList = userList._userList;
  this._truncateLength = userList._truncateLength;
  this._userCache = userList._userCache;
  this._avatars = userList._avatars;
  this._enableUserOptions = userList._enableUserOptions;
}

/**
 * Render the user
 *
 * @param {object} list
 * @param {object} user
 */

UserView.prototype.render = function(user, cb) {
  var displayName = _.isString(user.displayName) ? user.displayName : '';

  var tmplVars = {
    shortName: truncate(displayName, this._truncateLength),
    avatarColor: colors.get(user),
    loaded: false,
    avatarUrl: user.avatarUrl
  };

  var self = this;

  // Disable avatar img in template if it doesn't load
  this._validImage(tmplVars.avatarUrl, function(loaded) {
    var dataQuery = '[' + DATA_GOINSTANT_ID + '="' + user.id + '"]';
    var userEl = self._userList.querySelector(dataQuery);

    // Remove the existing element for this user if there is one.
    if (userEl) {
      userEl.parentNode.removeChild(userEl);
    }

    if (loaded) {
      tmplVars.loaded = true;
    }

    var template = _.template(userTemplate, tmplVars);
    var entry = document.createElement('li');
    entry.innerHTML = template;
    classes(entry).add('gi-user');
    entry.title = displayName;
    entry.setAttribute('data-goinstant-id', user.id);

    if (!self._enableUserOptions) {
      classes(entry.children[1]).add(NO_OPTIONS_CLASS);
    }

    var currentList = self._userList.children;

    // Update the local user. The local user is always the first in the list.
    var localUser = self._userCache.getLocalUser();
    if (user.id === localUser.id) {
      classes(entry).add(LOCAL_USER_CLASS);
      self._addLocalUserElement(entry);
      return cb();
    }

    var added = false;
    // Iterate through user elements in the list to find where the new entry
    // will go.
    _.each(currentList, function(indexEl) {
      // Ignore the local user as they will always be at the top.
      if (indexEl.getAttribute('data-goinstant-id') === localUser.id) {
        return;
      }

      var order = self._order(entry, indexEl);

      if (order < 1) {
        self._userList.insertBefore(entry, indexEl);
        added = true;
        return false;
      }
    });

    if (!added) {
      self._userList.appendChild(entry);
    }

    return cb();
  });
};

/**
 * @private
 */

/**
 * Try loading the avatar image
 * @private
 * @param {string} imgSrc The avatar image URL
 * @param {function} cb Callback when the image loads or errors,
 *                      takes a boolean.
 */
UserView.prototype._validImage = function(imgSrc, cb) {
  // Avatars are disabled
  if (!this._avatars) {
    return cb(false);
  }

  // Invalid img urls
  if (!imgSrc || !_.isString(imgSrc)) {
    return cb(false);
  }

  var img = new Image();
  img.onerror = function() {
    return cb(false);
  };

  img.onabort = function() {
    return cb(false);
  };

  img.onload = function() {
    return cb(true);
  };

  img.src = imgSrc;
};

/**
 * Adds the local user element to the userList
 * @private
 * @param {HTMLElement} entry The populated user template to add.
 */
UserView.prototype._addLocalUserElement = function(entry) {
  var next = this._userList.children[0];
  if (!next) {
    this._userList.appendChild(entry);
    return;
  }

  this._userList.insertBefore(entry, next);
};

/**
 * Compares 2 UserList indicator elements. Used to order them alphabetically by
 * name then id.
 * @private
 * @param {HTMLElement} a The element being added.
 * @param {HTMLElement} b The element being compared against.
 * @returns {number} Number representing the comparison. -1 = a < b, 1 = a > b,
 *                   0 = a === b.
 */
UserView.prototype._order = function(a, b) {
  var aName = a.getAttribute('title');
  var bName = b.getAttribute('title');
  if (aName < bName) {
    return -1;

  } else if(aName > bName) {
    return 1;
  }

  var aId = a.getAttribute('data-goinstant-id');
  var bId = b.getAttribute('data-goinstant-id');
  if (aId < bId) {
    return -1;

  } else if (aId > bId) {
    return 1;
  }

  // Same
  return 0;
};

function truncate(str, limit) {
  var shortened = '';

  if (str.length > limit) {
    var substring = str.substring(0, limit);

    if (str[limit] === ' ') {
      return trim(substring);

    } else {
      return substring + '...';
    }
  }

  return shortened || str;
}
