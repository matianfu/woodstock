/**
 * `this` is bound to node
 */

async function Get (m) {
  const name = `${m.body[0].value}.${m.body[1].value}`

  if (this.hasOwnProperty(`${iface}.${name}`)) { 

  return new VARIANT(prop) 
}

async function Set (m) {
  const ifaceName = m.interface
  const propName = m.member

} 

module.exports = {
  'interface': 'org.freedesktop.DBus.Properties',
  Get,
  Set,
  GetAll
}
