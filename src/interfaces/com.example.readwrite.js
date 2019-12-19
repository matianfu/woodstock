/**
 * This is a fictional interface for testing.
 *
 * @module ReadWriteUpdateInterface
 */
module.exports = {
  name: 'com.example.readwrite',
  methods: [
    {
      name: 'Update',
      args: [
        { name: 'name', type: 's', direction: 'in' },
        { name: 'value', type: 's', direction: 'in' },
      ],
    },
  ],
  properties: [
    {
      name: 'Read',
      type: 's',
      access: 'read',
    },
    {
      name: 'ReadWrite',
      type: 's',
      access: 'readwrite'
    }
  ],
}
