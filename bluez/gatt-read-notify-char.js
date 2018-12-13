const EventEmitter = require('events')
const GattCharacteristic1 = require('./gatt-characteristic1')

class ReadNotifyCharacteristic extends GattCharacteristic1(EventEmitter) {
  
  constructor (opts) {
    if (!opts.UUID) throw new Error('invalid opts.UUID')
    super()
    this.UUID = opts.UUID
    this.Flags = ['read']
    if (opts.indicate || opts.notify) {
      if (opts.indicate) {
        this.Flags.push('indicate')
      } else {
        this.Flags.push('notify')
      }

      this.Notifying = false
      this.StartNotify = () => this.Notifying = true
      this.StopNotify = () => this.Notifying = false
    }
  }

  /**
  Possible options: 
    "offset": uint16 offset
    "device": Object Device (Server only)
  */
  ReadValue (opts, callback) {
    opts = this.parseOpts(opts)
    let offset = opts.offset || 0
    let val = this.Value.slice(offset)
    callback(null, new ARRAY(Array.from(val), 'ay'))
  }

  // val is either an integer array or a buffer
  update (val) {
    if (Array.isArray(val) && val.every(b => Number.isInteger(b) && b >= 0 && b < 256)) {
      this.Value = val
    } else if (Buffer.isBuffer(val)) {
      this.Value = Array.from(val)
    } else {
      throw new Error('invalid value')
    }

    if (this.Notifying) {
      let iface = this.dobj.ifaces.find(iface => iface.name === 'org.freedesktop.DBus.Properties')
      if (iface) iface.PropertiesChanged(this, ['Value'])
    }
  }
}

module.exports = ReadNotifyCharacteristic
