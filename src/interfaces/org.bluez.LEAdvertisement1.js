module.exports = {
  name: 'org.bluez.LEAdertisement1',
  methods: [
    {
      name: 'Release',
      noReply: true
    }
  ],
  properties: [
    {
      // "broadcast" or "peripheral"
      name: 'Type', 
      type: 's',
      access: 'read',
      optional: true
    },
    {
      name: 'ServiceUUIDs',
      type: 'as',
      access: 'read'
      optional: true
    },
    {
      name: 'ManufacturerData', // DICT ???
    },
    {
      name: 'SolicitUUIDs',
      type: 'as',
      access: 'read',
      optional: true
    },
    {
      name: 'ServiceData',  // DICT ???
      
    },
    {
      name: 'Data'
    },
    {
      name: 'Discoverable'
    },
    {
      name: 'DiscoverableTimeout'
    },
    {
      name: 'Includes'
    },
    {
      name: 'LocalName',
      type: 's',
      access: 'read'
    },
    {
      name: 'Appearance',
    },
    {
      name: 'Duration'
    },
    {
      name: 'Timeout'
    },
    {
      name: 'SecondaryChannel'
    }
  ]
}
