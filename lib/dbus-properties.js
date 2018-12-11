const DBusInterface = require('./dbus-interface')

const { TYPE, STRING, ARRAY, VARIANT, DICT_ENTRY } = require('./dbus-types')

const xml = `\
<interface name="org.freedesktop.DBus.Properties">
  <method name="Get">
    <arg direction="in" type="s"/>
    <arg direction="in" type="s"/>
    <arg direction="out" type="v"/>
  </method>
  <method name="GetAll">
    <arg direction="in" type="s"/>
    <arg direction="out" type="a{sv}"/>
  </method>
  <method name="Set">
    <arg direction="in" type="s"/>
    <arg direction="in" type="s"/>
    <arg direction="in" type="v"/>
  </method>
  <signal name="PropertiesChanged">
    <arg type="s" name="interface_name"/>
    <arg type="a{sv}" name="changed_properties"/>
    <arg type="as" name="invalidated_properties"/>
  </signal>
</interface>`

class DBusProperties extends DBusInterface(xml) {
  Get () {
    // TODO
  }

  Set () {
    // TODO
  }

  /**
  iface is an interface object
  */
  getAll (iface) {
    let arr = new ARRAY('a{sv}')
    let props = iface.definition.properties()
    props.forEach(([prop, sig]) => {
//      if (iface.hasOwnProperty(prop)) {
      if (prop in iface) {
        arr.push(new DICT_ENTRY([new STRING(prop), new VARIANT(new TYPE(sig, iface[prop]))]))
      }
    })
    return arr
  }

  /**
  asynchronous version for external service
  */
  GetAll (name, callback) {
    let err, data
    let iface = this.dobj.ifaces.find(i => i.name === name.value)
    if (!iface) {
      err = new Error('biang biang')
    } else {
      data = this.getAll(iface)
    }

    if (callback && typeof callback === 'function') {
      process.nextTick(() => callback(err, data))
    } else {
      return err || data
    }
  }
}

module.exports = DBusProperties
