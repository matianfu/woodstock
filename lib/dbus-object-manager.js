const xml2js = require('xml2js')
const debug = require('debug')('dbus:object-manager')

const {
  LITTLE, BIG, TYPE,
  BYTE, BOOLEAN, INT16, UINT16, INT32, UINT32, INT64, UINT64, DOUBLE, UNIX_FD,
  STRING, OBJECT_PATH, SIGNATURE,
  STRUCT, ARRAY, VARIANT, DICT_ENTRY
} = require('./dbus-types')
const DBusInterface = require('./dbus-interface')
const DBusInterfaceDefinition = require('./dbus-interface-definition')

/*
ObjectManager is essentially a visitor calling GetAll on DBus.Properties interface

DBus.Properties           a{sv}                             DICT<STRING,VARIANT>
DBus.ObjectManager  a{oa{sa{sv}}}  DICT<OBJPATH,DICT<STRING,DICT<STRING,VARIANT>>>
                      |  |
                      |  -> this is interface name such as org
                      |
                      -> this is node path.
*/
class DBusObjectManager extends DBusInterface {
  GetManagedObjects (callback) {
    let total = new ARRAY('a{oa{sa{sv}}}')

    this.dobj.visit(dobj => {
      let DP = dobj.ifaces.find(i => i.name === 'org.freedesktop.DBus.Properties')
      if (DP) {
        total.push(new DICT_ENTRY([
          new OBJECT_PATH(dobj.objectPath()),
          dobj.ifaces.reduce((a, iface) => {
            if (iface.definition.properties().length) {
              a.push(new DICT_ENTRY([
                new STRING(iface.name),
                DP.getAll(iface)   // use internal version
              ])) 
            }
            return a
          }, new ARRAY('a{sa{sv}}'))
        ]))
      }
    })

    if (callback && typeof callback === 'function') {
      process.nextTick(() => callback(null, total))
    } else {
      return total
    }
  }
}

const xml = `\
<interface name="org.freedesktop.DBus.ObjectManager">
  <method name="GetManagedObjects">
    <arg direction="out" type="a{oa{sa{sv}}}" />
  </method>
</interface>
`

xml2js.parseString(xml, (err, result) => {
  if (err) throw err
  DBusObjectManager.prototype.definition = new DBusInterfaceDefinition(result.interface)
})

module.exports = DBusObjectManager
