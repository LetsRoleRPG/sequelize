'use strict';

const semver = require('semver');
const AbstractConnectionManager = require('../abstract/connection-manager');
const SequelizeErrors = require('../../errors');
const { logger } = require('../../utils/logger');
const DataTypes = require('../../data-types').mariadb;
const momentTz = require('moment-timezone');
const debug = logger.debugContext('connection:mariadb');
const parserStore = require('../parserStore')('mariadb');

/**
 * MariaDB Connection Manager
 *
 * Get connections, validate and disconnect them.
 * AbstractConnectionManager pooling use it to handle MariaDB specific connections
 * Use https://github.com/MariaDB/mariadb-connector-nodejs to connect with MariaDB server
 *
 * @private
 */
class ConnectionManager extends AbstractConnectionManager {
  constructor(dialect, sequelize) {
    sequelize.config.port = sequelize.config.port || 3306;
    super(dialect, sequelize);
    this.lib = this._loadDialectModule('mariadb');
    this.refreshTypeParser(DataTypes);
  }

  static _typecast(field, next) {
    if (parserStore.get(field.type)) {
      return parserStore.get(field.type)(field, this.sequelize.options, next);
    }
    return next();
  }

  _refreshTypeParser(dataType) {
    parserStore.refresh(dataType);
  }

  _clearTypeParser() {
    parserStore.clear();
  }

  /**
   * Connect with MariaDB database based on config, Handle any errors in connection
   * Set the pool handlers on connection.error
   * Also set proper timezone once connection is connected.
   *
   * @param {object} config
   * @returns {Promise<Connection>}
   * @private
   */
  async connect(config) {
    return {
      isValid: () => {
        return true;
      },
      end: () => {
        return;
      }
    };
  }

  async disconnect(connection) {
    // Don't disconnect connections with CLOSED state
    if (!connection.isValid()) {
      debug('connection tried to disconnect but was already at CLOSED state');
      return;
    }
    return await connection.end();
  }

  validate(connection) {
    return connection && connection.isValid();
  }
}

module.exports = ConnectionManager;
module.exports.ConnectionManager = ConnectionManager;
module.exports.default = ConnectionManager;
