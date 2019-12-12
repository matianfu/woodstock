const path = require('path')
const EventEmitter = require('events')

const uuid = require('uuid')

const { BYTE, STRING, ARRAY, DICT_ENTRY, VARIANT } = require('./types')

const DBus = require('./dbus')

// https://cgit.freedesktop.org/NetworkManager/NetworkManager/tree/examples/python/dbus

class NM extends EventEmitter {
  constructor () {
    super()
    this.shadow = null
    const bus = new DBus()

    bus.on('connect', () => {
      bus.AddMatch({
        type: 'signal',
        sender: 'org.freedesktop.NetworkManager',
        interface: 'org.freedesktop.DBus.ObjectManager',
        member: 'InterfacesAdded',
        path_namespace: '/org/freedesktop'
      }, err => {
        if (err) {
          return
        }
        bus.AddMatch({
          type: 'signal',
          sender: 'org.freedesktop.NetworkManager',
          interface: 'org.freedesktop.DBus.ObjectManager',
          member: 'InterfacesRemoved',
          path_namespace: '/org/freedesktop'
        }, err => {
          if (err) {
            return
          }
          bus.AddMatch({
            type: 'signal',
            sender: 'org.freedesktop.NetworkManager',
            interface: 'org.freedesktop.DBus.Properties',
            member: 'PropertiesChanged',
            path_namespace: '/org/freedesktop'
          }, err => {
            if (err) {
              return
            }
            bus.GetManagedObjects(
              'org.freedesktop.NetworkManager',
              '/org/freedesktop',
              (err, body) => {
                if (err) return

                this.shadow = body[0].eval()
                bus.on('signal', signal => this.handleSignal(signal))
                this.bus = bus

                this.emit('ready')
              })
          })
        })
      })
    })
  }

  handleSignal (signal) {
    const { path, member, body } = signal
    const iface = signal.interface

    if (iface === 'org.freedesktop.DBus.ObjectManager' &&
      member === 'InterfacesAdded') {
      this.interfacesAdded(...body.map(t => t.eval()))
    } else if (signal.interface === 'org.freedesktop.DBus.ObjectManager' &&
      signal.member === 'InterfacesRemoved') {
      this.interfacesRemoved(...body.map(t => t.eval()))
    } else if (signal.interface === 'org.freedesktop.DBus.Properties' &&
      signal.member === 'PropertiesChanged') {
      this.propertiesChanged(...body.map(t => t.eval()))
    } else {
      console.log('unhandled signal', signal)
    }
  }

  interfacesAdded (path, ifacesAndProps) {
    const obj = this.shadow[path]
    if (obj) {
      Object.assign(obj, ifacesAndProps)
    } else {
      this.shadow[path] = ifacesAndProps
    }
  }

  interfacesRemoved (path, ifaces) {
    const obj = this.shadow[path]
    if (!obj) {
      console.log(`${path} does not exist`)
      return
    }

    ifaces.forEach(iface => {
      if (Object.prototype.hasOwnProperty.call(obj, iface)) {
        delete obj[iface]
      } else {
        console.log(`${path} has no interface ${iface}, keys: ${Object.keys(obj)}`, obj)
      }
    })

    if (Object.keys(obj).length === 0) {
      delete this.shadow[path]
    }
  }

  propertiesChanged (path, ifaceName, changedProps, invalidatedProps) {
    const obj = this.shadow[path]
    if (!obj) return

    const iface = obj[ifaceName]
    if (!iface) return

    Object.assign(iface, changedProps)
    invalidatedProps.forEach(prop => delete iface[prop])
  }

  /**
   * returns an array of object path of wireless devices
   */
  findWireless () {
    const namespace = '/org/freedesktop/NetworkManager/Devices/'
    const device = 'org.freedesktop.NetworkManager.Device'
    const wireless = 'org.freedesktop.NetworkManager.Device.Wireless'
    const paths = Object.keys(this.shadow)
      .filter(path => path.startsWith(namespace) &&
        Object.prototype.hasOwnProperty.call(this.shadow[path], device) &&
        Object.prototype.hasOwnProperty.call(this.shadow[path], wireless))
    return paths
  }

  requestScan (name, callback) {
    const paths = this.findWireless(name)
    const node = this.shadow[paths[0]]
    const wireless = 'org.freedesktop.NetworkManager.Device.Wireless'
    const accesspoint = 'org.freedesktop.NetworkManager.AccessPoint'
    const aps = node[wireless].AccessPoints.map(path => this.shadow[path])

    console.log(node[wireless])
    aps.forEach(ap => console.dir(ap))
    aps.forEach(ap => {
      console.dir(Object.assign({}, ap[accesspoint], {
        Ssid: Buffer.from(ap[accesspoint].Ssid).toString()
      }))
    })

    this.bus.methodCall({
      destination: 'org.freedesktop.NetworkManager',
      path: paths[0],
      interface: 'org.freedesktop.NetworkManager.Device.Wireless',
      member: 'RequestScan',
      signature: 'a{sv}',
      body: [new ARRAY('a{sv}')]
    }, (err, body) => {
      console.log('return', err, body)
    })
  }

  addConnection (ssid, passphrase, callback) {
    /**
     * s_con = dbus.Dictionary({
     *     'type': '802-11-wireless',
     *     'uuid': str(uuid.uuid4()),
     *     'id': 'My-WPA-PSK'})
     *
     * s_wifi = dbus.Dictionary({
     *     'ssid': dbus.ByteArray("best-wifi".encode("utf-8")),
     *     'mode': 'infrastructure',
     * })
     *
     * s_wsec = dbus.Dictionary({
     *     'key-mgmt': 'wpa-psk',
     *     'auth-alg': 'open',
     *     'psk': 'super-secret-password',
     * })
     *
     * s_ip4 = dbus.Dictionary({'method': 'auto'})
     * s_ip6 = dbus.Dictionary({'method': 'ignore'})
     *
     * con = dbus.Dictionary({
     *     'connection': s_con,
     *     '802-11-wireless': s_wifi,
     *     '802-11-wireless-security': s_wsec,
     *     'ipv4': s_ip4,
     *     'ipv6': s_ip6
     *      })
     */

    // a{sa{sv}}
    const conn = new ARRAY([
      new DICT_ENTRY([new STRING('type'), new VARIANT(new STRING('802-11-wireless'))]),
      new DICT_ENTRY([new STRING('uuid'), new VARIANT(new STRING(uuid.v4()))]),
      new DICT_ENTRY([new STRING('id'), new VARIANT(new STRING(ssid))])
    ])

    const wifi = new ARRAY([
      new DICT_ENTRY([new STRING('ssid'),
        new VARIANT(new ARRAY(ssid.split('').map(chr => new BYTE(chr))))]),
      new DICT_ENTRY([new STRING('mode'), new VARIANT(new STRING('infrastructure'))])
    ])

    const wsec = new ARRAY([
      new DICT_ENTRY([new STRING('key-mgmt'), new VARIANT(new STRING('wpa-psk'))]),
      new DICT_ENTRY([new STRING('auth-alg'), new VARIANT(new STRING('open'))]),
      new DICT_ENTRY([new STRING('psk'), new VARIANT(new STRING(passphrase))])
    ])

    const ipv4 = new ARRAY([
      new DICT_ENTRY([new STRING('method'), new VARIANT(new STRING('auto'))])
    ])

    const ipv6 = new ARRAY([
      new DICT_ENTRY([new STRING('method'), new VARIANT(new STRING('auto'))])
    ])

    const connection = new ARRAY([
      new DICT_ENTRY([new STRING('connection'), conn]),
      new DICT_ENTRY([new STRING('802-11-wireless'), wifi]),
      new DICT_ENTRY([new STRING('802-11-wireless-security'), wsec]),
      new DICT_ENTRY([new STRING('ipv4'), ipv4]),
      new DICT_ENTRY([new STRING('ipv6'), ipv6])
    ])

    this.bus.methodCall({
      destination: 'org.freedesktop.NetworkManager',
      path: '/org/freedesktop/NetworkManager/Settings',
      interface: 'org.freedesktop.NetworkManager.Settings',
      member: 'AddConnection',
      signature: 'a{sa{sv}}',
      body: [connection]
    }, (err, body) => {
      if (err) return callback(err)
      console.log(body[0])
      callback(null, body[0])
    })
  }
}

module.exports = NM
