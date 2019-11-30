const DBus = require('src/dbus')

const client = new DBus({ role: 'client' })
client.on('connect', () => {
  console.log('client connected')
  if (server.connected) next()
})
const server = new DBus({ role: 'server' })
server.on('connect', () => {
  console.log('server connected')
  if (client.connected) next()
})

const next = () => {
  console.log('client', client.myName) 
  console.log('server', server.myName)

  client.introspect(server.myName, (err, data) => {
    console.log('error', err)
  })
}



