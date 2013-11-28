/*jshint browser:true*/
/*global module, require*/

'use strict';

/**
 * Module dependencies
 */

var classes = require('classes');
var _ = require('lodash');
var trim = require('trim');

var colors = require('colors-common');

/**
 * Templates
 */

var countTemplate = require('../templates/count-template.html');

/**
 * Constants
 */

var COUNT_CLASS = 'gi-count';

/**
 * Expose `countView`
 */

module.exports = CountView;

/**
 * @constructor
 */

function CountView(userList) {
  this._userList = userList._userList;
  this._countOnly = userList._countOnly;
}

/**
 * Render the user
 *
 * @param {object} list
 * @param {object} user
 */

CountView.prototype.render = function(count, cb) {
  var template = _.template(countTemplate, {
    count: count
  });

  var entry = document.createElement('li');
  classes(entry).add(COUNT_CLASS);
  entry.innerHTML = template;
  entry.setAttribute('data-goinstant-count', count);

  this._addCountElement(entry);

  return cb();
};

/**
 * @private
 */

/**
 * Adds the count element to the userList
 * @private
 * @param {HTMLElement} entry The populated user template to add.
 */
CountView.prototype._addCountElement = function(entry) {
  this._userList.appendChild(entry);
};
