const { UserSchema } = require('./user');
const { MenuItemSchema } = require('./menuItem');
const { OrderSchema } = require('./order');
const { ProfileSchema } = require('./profile');
const { LogSchema } = require('./log');

/**
 * Creates or retrieves models bound to a specific tenant's Mongoose connection.
 * @param {import('mongoose').Connection} connection
 * @returns {{ User, MenuItem, Order, Profile, Log }}
 */
function getTenantModels(connection) {
  if (!connection) {
    throw new Error('Mongoose Connection instance is required to resolve tenant models');
  }

  const User = connection.models['User'] || connection.model('User', UserSchema);
  const MenuItem = connection.models['MenuItem'] || connection.model('MenuItem', MenuItemSchema);
  const Order = connection.models['Order'] || connection.model('Order', OrderSchema);
  const Profile = connection.models['Profile'] || connection.model('Profile', ProfileSchema);
  const Log = connection.models['Log'] || connection.model('Log', LogSchema);

  return {
    User,
    MenuItem,
    Order,
    Profile,
    Log
  };
}

module.exports = {
  getTenantModels
};
