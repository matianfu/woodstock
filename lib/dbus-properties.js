class DBusProperties extends DBusInterface {
  constructor () {
    this.name = 'org.freedesktop.DBus.Properties'
  }

/**
  Get () {
  }
*/

/**
  Set () {
  }
*/

/**
  GetAll (name, callback) {
    let err, data
    let iface = this.dobj.ifaces.find(i => i.name === name)
    if (!iface) {
      err = new Error('biang biang') 
    } else {
      let arr = new ARRAY('a{sv}')
      this.dbus.ifaceDefs
        .find(ifd => ifd.name() === name)
        .properties()
        .forEach(([prop, sig]) => {
          if (iface[prop]) {
            arr.push(new DICT_ENTRY([
              new STRING(prop),
              new VARIANT(
            ])),
          }    
        })
    }
  }
*/
}
