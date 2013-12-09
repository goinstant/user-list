## How to use Avatars

You can add personalized avatars to GoInstant widgets  (those that identify
users individually), by using the avatarUrl user property. Currently the only
widget where custom avatars is supported is the [User List](../user_list.md).

### Table of Contents

1. [The avatarUrl property](#the-avatarurl-property)
1. [Setting the property](#setting-the-property)
 - [Manually setting the property](#manually-setting-the-property)
 - [Making a claim in the JWT](#making-a-claim-in-the-jwt)
1. [Accessing the property](#accessing-the-property)
1. [Widgets using avatars](#widgets-using-avatars)

### The avatarUrl property

All supported GoInstant widgets look for the user avatar in the user's
`avatarUrl` property. Any valid image URL set in the user object via any of the
methods described below will be used to display a custom avatar in various
GoInstant widgets. If the `avatarUrl` property is not set, found, or of an
unsupported type, the widget will omit the avatar from the UI.

Here's an example of a user that will use GoInstant's Twitter profile image as
their avatar in GoInstant widgets.

```json
{
   "id": "1234",
   "displayName": "tom",
   "avatarColor": "#00ff00",
   "avatarUrl": "https://si0.twimg.com/profile_images/1539812195/400x400-GoInstant_bigger.png"
}
```

The user above would appear in, for example, the [User List](../user_list.md)
with their avatar image displayed next to their displayName.

A valid avatar image is any image type that is supported by the user agent. If
the image type is supported in some user agents but not others, the image will
only be displayed in the supported agents.

### Setting the property

#### Manually setting the property

You can directly set the `avatarUrl` property before or after widget
initialization.

```js
// Assuming you already have the user's key from room#user or room#users.
userKey.key('avatarUrl').set('http://YOURAVATAR.png', function(err) {
  if (err) { return console.error(err); }
  // The user now has an avatar displayed in the user-list, etc.
});
```

#### Making a claim in the JWT

If you always want an authenticated user to have the same avatar, it can be
specified up front by adding a private claim to their token that is used when
connecting to GoInstant. All private claims get turned into properties on the
user object, allowing you to set the `avatarUrl` property by making a claim
in the token.

See the [Users & Authentication](../../guides/users_and_authentication.md)
guide for details on generating JWTs. In a [node.js](http://www.nodejs.org)
application, adding a private claim might look like the following using [JWT
Simple](https://github.com/hokaccha/node-jwt-simple):

```js
var claims = {
  iss: 'myapp.com', // Issuer, required claim
  sub: 'userUniqueId', // Subject, required claim
  dn: 'userDisplayName', // Display Name, private claim
  avatarUrl: 'http://YOURAVATAR.png' // Avatar for the widget UI, private claim
};

var token = jwtSimple.encode(claims, mySecretAppKey);

// Pass the token when connecting to GoInstant, and user will display display
// their avatar.
```

### Accessing the property

You may want to access the `avatarUrl` property of an existing user in order to
integrate the assigned `avatarUrl` into your application. This is easily done
using either of the `user` or `users` functions on the `room` object.

```js
// Once you've connected to a room
room.users = function(err, users, keys) {
  if (err) { return console.error(err); }

  for (var id in users) {
    var user = users[id];
    console.log('User ' + user.displayName + ' has avatar ' + user.avatarUrl);
  }
};
```

Just remember that your application is responsible for assigning the `avatarUrl`
property, and you may need to handle the non-existence case if the property has
not yet been set. GoInstant widgets handle this by omitting the avatar image
from the UI when there is no `avatarUrl` available or it is invalid.

### Widgets using avatars

The following GoInstant widgets use the `avatarUrl` to display an image as
part of their respective UIs.

* [User List](../user_list.md)
