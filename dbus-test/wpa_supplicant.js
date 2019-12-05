const path = require('path')

const chai = require('chai')
const expect = chai.expect

const DBus = require('src/dbus')

describe(path.basename(__filename), () => {
  it('GetAll', done => {
    const client = new DBus()
    client.on('connect', () => {
      client.GetAllProps('fi.w1.wpa_supplicant1', 
        '/fi/w1/wpa_supplicant1',
        'fi.w1.wpa_supplicant1', 
        (err, body) => {
          // console.dir(body, { depth: 9 })
          done()
        })
    })
  })

  it('Get Interfaces', done => {
    const client = new DBus()
    client.on('connect', () => {
      client.GetProp('fi.w1.wpa_supplicant1', 
        '/fi/w1/wpa_supplicant1',
        'fi.w1.wpa_supplicant1', 
        'Interfaces',
        (err, body) => {
          if (err) return done(err)
          const paths = body[0].elems[1].elems.map(o => o.value)
          if (paths.length === 0) return done() 
          
          client.GetAllProps('fi.w1.wpa_supplicant1',
            paths[0],
            'fi.w1.wpa_supplicant1.Interface',
            (err, body) => {
            console.dir(body, { depth: 5 })
            done()
          })
        })
    })

    client.on('close', () => {
      console.log('close')
    })
  })

})
