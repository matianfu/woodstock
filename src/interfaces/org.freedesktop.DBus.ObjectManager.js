/**
 * Defined in DBus Specification
 *
 * ```
 * org.freedesktop.DBus.ObjectManager.GetManagedObjects (
 *     out DICT<OBJPATH,DICT<STRING,DICT<STRING,VARIANT>>> objpath_interfaces_and_properties);
 * 
 * org.freedesktop.DBus.ObjectManager.InterfacesAdded (
 *     OBJPATH object_path,
 *     DICT<STRING,DICT<STRING,VARIANT>> interfaces_and_properties);
 * org.freedesktop.DBus.ObjectManager.InterfacesRemoved (
 *     OBJPATH object_path,
 *     ARRAY<STRING> interfaces);
 * ```
 */
module.exports = {
  name: 'org.freedesktop.DBus.ObjectManager',
  methods: [
    {
      name: 'GetManagedObjects',
      args: [
        {
          name: 'objpath_interfaces_and_properties',
          type: 'a{oa{sa{sv}}}',
          direction: 'out'  
        }
      ]
    }
  ],
  signals: [
    {
      name: 'InterfacesAdded',
      args: [
        {
          name: 'object_path',
          type: 'o'
        },
        {
          name: 'interfaces_and_properties',
          type: 'a{sa{sv}}'
        }
      ]
    },
    {
      name: 'InterfaceRemoved',
      args: [
        { 
          name: 'object_path',
          type: 'o'
        },
        {
          name: 'interfaces',
          type: 'as'
        } 
      ]
    }
  ] 
}
