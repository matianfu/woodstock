const NM = require('../src/nm')

const nm = new NM()
nm.on('error', err => console.log(err))
nm.on('ready', () => {
  nm.requestScan()

  setTimeout(() => {
    nm.addConnection('Naxian800', 'vpai1228', (err, res) => {
      console.log(err, res)
    })
  }, 3000)
})


