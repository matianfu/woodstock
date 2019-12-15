const NM = require('../src/nm')

const nm = new NM()
nm.on('error', err => console.log(err))
nm.on('ready', () => {
  nm.requestScan()

  // console.log(nm.shadow['/org/freedesktop/NetworkManager'])
  nm.shadow
    ['/org/freedesktop/NetworkManager/Settings']
    ['org.freedesktop.NetworkManager.Settings']
    .Connections.forEach(c => {
    })

/**
  setTimeout(() => {
    nm.addConnection('Naxian800', 'vpai1228', (err, res) => {
      console.log(err, res)
    })
  }, 3000)
*/
})


