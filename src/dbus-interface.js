const EventEmitter = require('events')

/**
 * A DBusInterface has properties and methods
 */
class DBusInterface extends EventEmitter {
  /**
   * @param {object} opts - options
   */
  constructor (opts) {
    super()
    this.opts = opts
  }
}
