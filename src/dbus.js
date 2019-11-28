
/**
 * DBus client
 * 
 * DBus client allows user to
 * 1. connect to a dbus socket
 * 2. browsing dbus via org.freedesktop.DBus message bus interface
 * 3. invoke methods or handle signals
 * 4. register a custom DBus service
 */
class DBus extends EventEmitter {
  /**
   *
   */
  constructor (opts) {
    super()
    this.driver = new DBusDriver()
    this.driver.on('connect', () => this.emit('connect'))
    this.driver.on('message', msg => {})
    this.driver.on('invocation', m => this.handleMethodCall(m))
    this.driver.on('signal', m => this.handleSignal(m))
  }

  handleMethodCall (m) {
  }

  handleSignal () {
  }

  connect () {
  }

  registerDBusService () {
  } 

  unregisterDBusService () {
  } 
}
