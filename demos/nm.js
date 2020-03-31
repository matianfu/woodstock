const path = require('path')
const EventEmitter = require('events')
const uuid = require('uuid')

const woodstock = require('../index')
const { BYTE, STRING, ARRAY, DICT_ENTRY, VARIANT } = woodstock.types

// https://cgit.freedesktop.org/NetworkManager/NetworkManager/tree/examples/python/dbus

const describeEnums = (enums, flags) => 
  Object.keys(enums).find(key => enums[key] === flags) || flags

const describeBits = (enums, flags) => 
  Object.keys(enums).reduce((arr, prop) => 
    enums[prop] & flags ? [...arr, prop] : arr, [])

// https://cgit.freedesktop.org/NetworkManager/NetworkManager/tree/libnm-core/nm-dbus-interface.h

const NM80211ApFlags = {
  NM_802_11_AP_SEC_NONE: 0x00000000,   
  NM_802_11_AP_SEC_PAIR_WEP40: 0x00000001, 
	NM_802_11_AP_FLAGS_WPS     : 0x00000002,
	NM_802_11_AP_FLAGS_WPS_PBC : 0x00000004,
	NM_802_11_AP_FLAGS_WPS_PIN : 0x00000008,
}

const NM80211ApSecurityFlags = {
	NM_802_11_AP_SEC_NONE            : 0x00000000,
	NM_802_11_AP_SEC_PAIR_WEP40      : 0x00000001,
	NM_802_11_AP_SEC_PAIR_WEP104     : 0x00000002,
	NM_802_11_AP_SEC_PAIR_TKIP       : 0x00000004,
	NM_802_11_AP_SEC_PAIR_CCMP       : 0x00000008,
	NM_802_11_AP_SEC_GROUP_WEP40     : 0x00000010,
	NM_802_11_AP_SEC_GROUP_WEP104    : 0x00000020,
	NM_802_11_AP_SEC_GROUP_TKIP      : 0x00000040,
	NM_802_11_AP_SEC_GROUP_CCMP      : 0x00000080,
	NM_802_11_AP_SEC_KEY_MGMT_PSK    : 0x00000100,
	NM_802_11_AP_SEC_KEY_MGMT_802_1X : 0x00000200,
	NM_802_11_AP_SEC_KEY_MGMT_SAE    : 0x00000400,
	NM_802_11_AP_SEC_KEY_MGMT_OWE    : 0x00000800,
}

const NM80211Mode = {
	NM_802_11_MODE_UNKNOWN : 0,
	NM_802_11_MODE_ADHOC   : 1,
	NM_802_11_MODE_INFRA   : 2,
	NM_802_11_MODE_AP      : 3,
	NM_802_11_MODE_MESH    : 4,
}

class NM extends EventEmitter {
  constructor () {
    super()
    this.shadow = null
    const bus = woodstock()

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
            bus.GetManagedObjects( {
                destination: 'org.freedesktop.NetworkManager',
                path: '/org/freedesktop'
              }, (err, body) => {
                if (err) return

                this.shadow = body[0].eval()

                console.log('shadow', Object.keys(this.shadow))

                console.log('shadow networkmanager', this.shadow['/org/freedesktop/NetworkManager'])

                const settings = Object.keys(this.shadow).filter(k => k.startsWith('/org/freedesktop/NetworkManager/Settings/')).map(k => this.shadow[k])

                console.log('initial settings', settings)


                bus.on('signal', signal => this.handleSignal(signal))
                this.bus = bus

                this.emit('ready')
              })
          })
        })
      })
    })
  }

  /**
   * For InterfacedAdded and interfacedRemoved from ObjectManager, the first (body) argument 
   * is the path.
   * For PropertiesChanged from Properties, path is the member of signal.
   */
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
      this.propertiesChanged(path, ...body.map(t => t.eval()))
    } else {
      console.log('unhandled signal', signal)
    }
  }

  interfacesAdded (path, ifacesAndProps) {

    if (path.startsWith('/org/freedesktop/NetworkManager/AccessPoint/')) {
      console.log('accesspoint added', path, Buffer.from(ifacesAndProps['org.freedesktop.NetworkManager.AccessPoint'].Ssid).toString())
    } else {
      console.log('interfaceAdded', path)
    }

    const obj = this.shadow[path]
    if (obj) {
      Object.assign(obj, ifacesAndProps)
    } else {
      this.shadow[path] = ifacesAndProps
    }
  }

  interfacesRemoved (path, ifaces) {

    console.log('interfaceRemoved', path)

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
    const aps = node[wireless].AccessPoints.map(path => this.shadow[path][accesspoint])

    console.log('====== aps')
    aps.forEach(ap => {
      const o = Object.assign({}, ap, {
        Flags: describeBits(NM80211ApFlags, ap.Flags),
        WpaFlags: describeBits(NM80211ApSecurityFlags, ap.WpaFlags),
        RsnFlags: describeBits(NM80211ApSecurityFlags, ap.RsnFlags),
        Ssid: Buffer.from(ap.Ssid).toString('utf8'),
        Mode: describeEnums(NM80211Mode, ap.Mode) 
      })

      if (o.Ssid !== 'Naxian800' && o.Ssid !== 'Naxian800-Guest') console.log(o)
    })
    console.log('======')

    this.bus.invoke({
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

  /**
   * DBus connection is a collection of dictionaries.
   */
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

    this.bus.invoke({
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

  ListConnections () {
  }

  ActivateConnection () {
  }

  RemoveConnection () {
  }
}

module.exports = NM
