class DBusService extends EventEmitter {
  constructor () {
    this.dbus = dbus
    this.root = root
  }

  handleMessage (m) {
    if (m.type === 'METHOD_CALL') {
      // find object or return error
    } else if (m.type === 'SIGNAL') {
      // 
    }
  } 
}


