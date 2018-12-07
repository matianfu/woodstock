/**
*/
class DBusInterface {
  constructor (opts) {
    // use js type, defaults to false
    this.useJsType = (opts && opts.useJsType) || false  
    // export name
    Object.defineProperty(this, 'name', {
      get: () => this.definition && this.definition.name
    })
  }
}

module.exports = DBusInterface
