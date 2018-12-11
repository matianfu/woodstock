const DBusInterface = require('../lib/dbus-interface')

const xml = `\
<interface name="org.bluez.GattCharacteristic1">
  <method name="ReadValue">
    <arg name="options" direction="in" type="a{sv}" />
    <arg direction="out" type="ay" />
  </method> 
  <method name="WriteValue">
    <arg name="value" direction="in" type="ay" />
    <arg name="options" direction="in" type="a{sv}" />
  </method>
  <!--
  <method name="AcquireWrite">
    <arg name="options" direction="in" type="a{sv}" />
  </method>
  <method name="AcquireNotify">
  </method>
  -->
  <method name="StartNotify" />
  <method name="StopNotify" />
  <method name="Confirm" />
  
  <!-- read-only -->
  <property name="UUID" type="s" />
 
  <!-- read-only --> 
  <property name="Service" type="o" />

  <!-- read-only, optional -->
  <property name="Value" type="ay" />

  <!-- read-only, optional -->
  <property name="WriteAcquired" type="b" />

  <!-- read-only, optional -->
  <property name="NotifyAcquired" type="b" />

  <!-- read-only, optional -->
  <property name="Notifying" type="b" />

  <!-- read-only -->
  <property name="Flags" type="as" />

  <!-- non-standard -->
  <property name="Descriptors" type="ao" />
</interface>
`

module.exports = DBusInterface(xml)

