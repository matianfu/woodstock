
// this.dobj and this.dbus is available
// after interface being added to a dbus object
class DBusInterface extends EventEmitter {

  constructor (dobj, props) {

    this.name = props.name  // interface name

    let def = this.dbus.interfaceDefinition(this.name)
    if (!def) throw new Error(`no definition for interface ${this.name}`)
/**
    if (props.hasOwnProperty('methods')) {
      this.methods = 
    }
*/
  }
}

module.exports = DBusInterface
