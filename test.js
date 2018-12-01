const connect = require('./lib/connect')

connect((err, bus) => {
  bus.invoke({
    path: '/org/freedesktop/DBus',
    interface: 'org.freedesktop.DBus',
    member: 'Hello',
    destination: 'org.freedesktop.DBus',
  }, (err, body) => {
    console.log('return', err, body)
  })
})
