class DBusInterface {
  constructor () {
    Object.defineProperty(this, 'name', {
      get () {
        // console.log('####', this.definition)
        // console.log('$$$$', this.definition.name)
        return this.definition && this.definition.name
      }
    })
  }

  // sub-class can override this function
  useDBusType () {
    return false
  }
}

module.exports = DBusInterface
