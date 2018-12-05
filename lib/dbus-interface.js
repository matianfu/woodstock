/**
*/
class DBusInterface {
  constructor () {
    Object.defineProperty(this, 'name', {
      get: () => this.definition && this.definition.name
    })
  }

  // low level sub-class can override this function
  useDBusType () {
    return false
  }
}

module.exports = DBusInterface
