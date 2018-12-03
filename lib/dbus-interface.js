const xml2js = require('xml2js')

const defs = [
`<interface name="org.freedesktop.DBus.Introspectable">
  <method name="Introspect">
    <arg direction="out" type="s"/>
  </method>
</interface>`, 
`<interface name="org.freedesktop.DBus.Properties">
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
</interface>`,
/**
`<interface name="org.bluez.LEAdvertisement1">
  <method name="
</interface>`, */
]

class DBusInterface {
  constructor (def) {
    xml2js.parseString(def, (err, obj) => {
      if (err) {
        throw err 
      } else {
        this.data = obj.interface 
      }

      // console.dir(this, { depth: 10 }) 
    })
  }

  name () {
    return this.data.$.name
  }

  // return a signature
  method (name) {
    if (this.data && this.data.method) {
      let m = this.data.method.find(o => o.$.name === name)
      if (m) return m.arg.map(x => x.$)
    } 
  }

  signal (name) {
  }

  property (name) {
  }
}

module.exports = defs.map(def => new DBusInterface(def))
