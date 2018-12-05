const xml2js = require('xml2js')
const debug = require('debug')('dbus:properties')

const {
  LITTLE, BIG, TYPE,
  BYTE, BOOLEAN, INT16, UINT16, INT32, UINT32, INT64, UINT64, DOUBLE, UNIX_FD,
  STRING, OBJECT_PATH, SIGNATURE,
  STRUCT, ARRAY, VARIANT, DICT_ENTRY
} = require('./dbus-types')
const DBusInterface = require('./dbus-interface')
const DBusInterfaceDefinition = require('./dbus-interface-definition')

class DBusProperties extends DBusInterface {

/**
  Get () { }
  Set () { }
*/

  GetAll (name, callback) {
    debug('GetAll', name) 

    let err, data
    let iface = this.dobj.ifaces.find(i => i.name === name.value)

    debug(this.dobj)

    if (!iface) {
      err = new Error('biang biang') 
    } else {
      data = new ARRAY('a{sv}')
      let props = iface.definition.properties()
      props.forEach(([prop, sig]) => {
        if (iface.hasOwnProperty(prop)) {
          data.push(new DICT_ENTRY([new STRING(prop), new VARIANT(new TYPE(sig, iface[prop]))]))
        }  
      })
    }
    process.nextTick(() => callback(err, [data]))
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
  DBusProperties.prototype.definition = new DBusInterfaceDefinition(result.interface)
})

module.exports = DBusProperties
