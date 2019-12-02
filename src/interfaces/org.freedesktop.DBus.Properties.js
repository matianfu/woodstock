module.exports = {
  name: 'org.freedesktop.DBus.Properties',
  methods: [
    {
      name: 'GET',
      args: [
        { name: 'intreface_name', type: 's', direction: 'in' },
        { name: 'property_name', type: 's', direction: 'in' },
        { name: 'value', type: 'v', direction, 'out' }
      ]
    },
    {
      name: 'SET',
      args: [
        { name: 'interface_name', type: 's', direction: 'in' },
        { name: 'property_name', type: 's', direction: 'in' },
        { name; 'value', type: 'v', direction: 'in' }
      ]
    },
    {
      name: 'GetAll',
      args: [
        { name: 'interface_name', type: 's', direction: 'in' },
        { name: 'props', type: 'a{sv}', direction: 'out' }
      ] 
    }
  ]
}
