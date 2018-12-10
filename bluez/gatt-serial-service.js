const EventEmitter = require('events')

const GattService1 = require('./gatt-service1')
const GattCharacteristic1 = require('./gatt-characteristic1-2')

/**
*/
class GattSerialCharacteristic0 extends GattCharacteristic1(EventEmitter) {

  constructor (props) {
    super ()
    this.UUID = '80000001-0182-406c-9221-0a6680bd0943'
    this.Flags = ['write', 'indicate']
  }

  StartNotify (m) {
    this.emit('startNotify')
  }

  StopNotify (m) {
    this.emit('stopNotify')
  }

  Confirm (m) {
    this.emit('confirm')
  }

  WriteValue (m, value) {
    this.emit('writeValue', m, value)
  } 
}

class GattSerialService extends EventEmitter {

  constructor (request) {
    super ()

    this.sessionId = 0

    this.started = false
    this.pending = false
    this.incoming = ''
    this.outgoing = ''

    let pipe = ''
    pipe.on('startNotify', () => this.start())
    pipe.on('stopNotify', () => this.stop())
    pipe.on('confirm', () => this.handleConfirm())
    pipe.on('writeValue', value => this.receive(value))
    this.pipe = pipe

    this.serviceItf = new GattService1({
      UUID: '80000000-0182-406c-9221-0a6680bd0943',
      Primary: !!opts.Primary
    })

    this.charasteristicItf = new GattCharacteristic1({
    })

     
  }

  start () {
    this.started = true
    this.pending = false
    this.incoming = ''
    this.outgoing = ''
    this.emit('start', this.sessionId++)
  }

  stop () {
    this.started = false
    this.emit('stop', this.sessionId) 
  }

  receive (value) {
    if (!this.started) return
    this.incoming += value 

    while (this.incoming.indexOf('\n')) {
      let idx = this.incomming.indexOf('\n')
      let line = this.incomming.slice(0, idx)
      this.incomming = this.incoming.slice(idx + 1)
      try {
        this.emit('data', JSON.parse(line))
      } catch (e) {
        // silent
      }
    }
  }

  handleConfirm () {
    if (!this.started) return
    this.pending = false
    this.send()
  }

  _send (string) {
    if (string) this.outgoing += string
    if (this.waitingForConfirm) return
    let payload = this.outgoing.slice(0, 20)
    this.outgoing = this.outgoing.slice(20)
    // TODO
  }

  // no callback ???
  send (obj) {
    if (!this.started) return
    if (obj.sessionId !== this.sessionId) return
    try {
      let string = JSON.stringify(obj)
      this.send(string)
    } catch (e) {
      console.log(e)
    }
  }

  attach (dobj) {
    dobj.addInterface(this.serviceInterface)
  }

  detach (dobj) {
  }
}
