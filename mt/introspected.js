const { STRING } = require('src/dbus-types')
const DBusDriver = require('src/dbus-driver')

const HEADER = `\
<!DOCTYPE node PUBLIC "-//freedesktop//DTD D-BUS Object Introspection 1.0//EN"
  "http://www.freedesktop.org/standards/dbus/1.0/introspect.dtd">
<node>
`

const PEER = `\
  <interface name="org.freedesktop.DBus.Peer">
    <method name="Ping"/>
    <method name="GetMachineId">
      <arg type="s" name="machine_uuid" direction="out"/>
    </method>
  </interface>
`
const INTROSPECTABLE = `\
  <interface name="org.freedesktop.DBus.Introspectable">
    <method name="Introspect">
      <arg type="s" name="xml_data" direction="out"/>
    </method>
  </interface>
`

const FOOTER = `\
</node>
`
const xml = HEADER + PEER + INTROSPECTABLE + FOOTER

const driver = new DBusDriver()
driver.on('connect', () => console.log('connect'))
driver.on('message', m => {

/**
{ le: true,
  type: 'METHOD_CALL',
  flags: {},
  version: 1,
  serial: 184,
  path: '/',
  interface: 'org.freedesktop.DBus.Introspectable',
  destination: ':1.660',
  member: 'Introspect',
  sender: ':1.665',
  bytesDecoded: 136 }
*/

  console.log(m)

  if (m.type === 'METHOD_CALL') {
    if (m.interface === 'org.freedesktop.DBus.Introspectable' &&
      m.member === 'Introspect') {

/**
{ le: true,
  type: 'METHOD_RETURN',
  flags: { noReply: true },
  version: 1,
  serial: 1,
  destination: ':1.691',
  replySerial: 1,
  signature: 's',
  sender: 'org.freedesktop.DBus',
  body: [ STRING { value: ':1.691' } ],
  bytesDecoded: 91 }
*/

      const xmlString = new STRING(xml)
      try {
        driver.methodReturn(m, { 
          signature: 's', 
          body: [new STRING(xml)] 
        })
      } catch (e) {
        console.log(e)
      }
    }
  }
})
