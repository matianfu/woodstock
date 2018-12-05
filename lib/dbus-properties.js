const xml2js = require('xml2js')

const DBusInterfaceDefinition = require('./dbus-interface-definition')

class DBusProperties extends DBusInterface {
  constructor () {
  }

/**
  Get () {
  }
*/

/**
  Set () {
  }
*/

  GetAll (name, callback) {
    let err, data
    let iface = this.dobj.ifaces.find(i => i.name === name)
    if (!iface) {
      err = new Error('biang biang') 
    } else {
      data = new ARRAY('a{sv}')
      this.dbus.ifaceDefs
        .find(ifd => ifd.name() === name)
        .properties()
        .forEach(([prop, sig]) => {
          if (iface.hasOwnProperty(prop)) {
            arr.push(new DICT_ENTRY([
              new STRING(prop),
              new VARIANT(new TYPE(sig, iface[prop]))
            ])),
          }    
        })
    }

    process.nextTick(() => callback(err, data))
  }
}

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

xml2js.parseString(xml, (err, result) => {
  if (err) throw err
  DBusProperties.prototype.definition = result.interface 
})

module.exports = DBusProperties
