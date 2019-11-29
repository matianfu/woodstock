const EventEmitter = require('events')

class DBusInterface extends EventEmitter {
  /**
   * @param {object} opts - options
   */
  constructor (opts) {
    super()
    this.opts = opts
  }
}
