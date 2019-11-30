module.exports = {
  methods: [
    {
      name: 'ReadValue',
      args: [
        { name: 'options', type: 'a{sv}', direction: 'in' },
        { name: 'value', type: 'ay', direction: 'out' }
      ]
    },
    {
      name: 'WriteValue',
      args: [
        { name: 'value', type: 'ay', direction: 'in' },
        { name: 'options', type: 'a{sv}', direction: 'in' }
      ]
    },
    {
      name: 'AcquireWrite',
      args: [
        { name: 'options', type: 'a{sv}', direction: 'in' },
        { name: 'fd', type: 'q', direction: 'out' }
      ],
      optional: true
    },
    {
      name: 'AcquireNotify',
      args: [
        { name: 'options', type: 'a{sv}', direction: 'in' },
        { name: 'fd', type: 'q', direction: 'out' }
      ],
      optional: true
    },
    { name: 'StartNotify' },
    { name: 'StopNotify' },
    { name: 'Confirm', optional: true }
  ],

  properties: [
    { name: 'UUID', type: 's', access: 'read' },
    { name: 'Service', type: 'o', access: 'read' },
    { name: 'Value', type: 'ay', access: 'read', optional: true },
    { name: 'WriteAcquired', type: 'b', acess: 'read', optional: true },
    { name: 'NotifyAcquired', type: 'b', access: 'read', optional: true },
    { name: 'Notifying', type: 'b', access: 'read', optional: true },
    { name: 'Flags', type: 'as', access: 'read' },
    { name: 'Handle', type: 'q', access: 'readwrite', optional: true }
  ]
}
