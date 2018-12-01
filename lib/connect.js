const net = require('net')
const DBus = require('./dbus')

const connect = (callback) => {
  const socket = net.createConnection('/run/dbus/system_bus_socket')
  socket.on('error', err => {
    socket.removeAllListeners()
    socket.on('error', () => {})
    callback(err)
  })

  socket.on('data', data => {
    let s = data.toString().trim()
    if (/^OK\s[a-f0-9]{32}$/.test(s)) {
      socket.write(`BEGIN\r\n`)  
      socket.removeAllListeners()
      let bus = new DBus(socket)
      callback(null, bus)
    } else {
      socket.removeAllListeners()
      socket.on('error', () => {})
      socket.end()
      let err = new Error(`handshake failed with message "${s}"`)
      callback(err)
    }
  })

  let uid = process.getuid()
  let hex = Buffer.from(uid.toString()).toString('hex')
  socket.write(`\0AUTH EXTERNAL ${hex}\r\n`)
}

module.exports = connect

