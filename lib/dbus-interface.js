class DBusInterface extends EventEmitter {
  name () {
    return this.definition && this.definition.name
  }
}

module.exports = DBusInterface
