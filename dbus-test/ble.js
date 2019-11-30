const path = require('path')

const chai = require('chai')
const expect = chai.expect

const DBus = require('src/dbus')
const BLE = require('src/ble')
const { CONTAINER_TYPE } = require('src/types')

describe(path.basename(__filename), () => {
  it('introspect root', done => {
    const dbus = new DBus()
    dbus.on('connect', () => {
      dbus.introspect('org.bluez', (err, body) => {
        console.log(err, body)
        done()
      })
    })
  })

  it('om get everything', done => {
    const dbus = new DBus()
    dbus.on('connect', () => {
      dbus.methodCall({
        destination: 'org.bluez',
        path: '/',
        'interface': 'org.freedesktop.DBus.ObjectManager',
        member: 'GetManagedObjects'
      }, (err, body) => {
        body[0].elems.forEach(elem => {
          console.log(elem.elems[0].value)
          elem.elems[1].elems.forEach(ele => {
            console.log(' ', ele.elems[0].value) 
            // console.log(' ', ele.elems[1].elems.length && ele.elems[1].elems)
            if (ele.elems[1].elems.length) {
              const els = ele.elems[1].elems
              els.forEach(el => {

                const v = el.elems[1].elems[1]

                console.log('    ', 
                  el.elems[0].value,
                  v instanceof CONTAINER_TYPE 
                    ? v.elems.map(x => x.value) : v.value)
              })
            }
          })
        }) 

        done()
      })
    })
  })
})
