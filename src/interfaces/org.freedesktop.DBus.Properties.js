/**
 * Defined in DBus Specification
 *
 * ```
 * org.freedesktop.DBus.Properties.Get (
 *     in STRING interface_name,
 *     in STRING property_name,
 *     out VARIANT value);
 * org.freedesktop.DBus.Properties.Set (
 *     in STRING interface_name,
 *     in STRING property_name,
 *     in VARIANT value);
 * org.freedesktop.DBus.Properties.GetAll (
 *     in STRING interface_name,
 *     out DICT<STRING,VARIANT> props);
 *
 * org.freedesktop.DBus.Properties.PropertiesChanged (
 *     STRING interface_name,
 *     DICT<STRING,VARIANT> changed_properties,
 *     ARRAY<STRING> invalidated_properties);
 * ```
 */

module.exports = {
  name: 'org.freedesktop.DBus.Properties',
  methods: [
    {
      name: 'Get',
      args: [
        { name: 'interface_name', type: 's', direction: 'in' },
        { name: 'property_name', type: 's', direction: 'in' },
        { name: 'value', type: 'v', direction: 'out' }
      ]
    },
    {
      name: 'Set',
      args: [
        { name: 'interface_name', type: 's', direction: 'in' },
        { name: 'property_name', type: 's', direction: 'in' },
        { name: 'value', type: 'v', direction: 'in' }
      ]
    },
    {
      name: 'GetAll',
      args: [
        { name: 'interface_name', type: 's', direction: 'in' },
        { name: 'props', type: 'a{sv}', direction: 'out' }
      ]
    }
  ],
  signals: [
    {
      name: 'PropertiesChanged',
      args: [
        { name: 'interface_name', type: 's' },
        { name: 'changed_properties', type: 'a{sv}' },
        { name: 'invalidated_properties', type: 'as' }
      ]
    }
  ]
}
