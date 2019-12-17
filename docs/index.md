# Woodstock

`woodstock` is a lightweight and compact DBus library.

It allows the user program to access system services, such as NetworkManager, via DBus. 

Sometimes, the user program may also need to provide a simple service via DBus. For example, Bluez requires the client program to register its own DBus objects to implement BLE advertisement or GATT services. `woodstock` fits this requirement easily.

`woodstock` is not intended to be a fully-fledged DBus library, providing all APIs from `org.freedesktop.DBus`, or allowing the user program to implment a complex service which cannot be represented by a value store.

The following interfaces are supported:

- `org.freedesktop.DBus.Peer`
- `org.freedesktop.DBus.Properties`
- `org.freedesktop.DBus.ObjectManager`

`org.freedesktop.DBus.Introspectable` is not supported yet. But it could be supported if somebody requires.

# DBus

`DBus` class is provided by `src/dbus.js`. It is the single class the user program should be interested with.

For accessing system services, the following methods are useful:

- `methodCall`, invoking a method on remote DBus object;
- `addMatch`, register signals from remote DBus object;
- `on('signal', () => {})`, register a handler for signals;

For providing DBus services, the user program create DBus object via `addNode` methods.

`DBus` maintains a list of DBus objects internally. These object are mentioned as **local** DBus objects.

# Types

DBus is a binary protocol which defines its own data types.

# Message Format

All internal functions pass messages as arguments.



Invoked by remote DBus service or clients


M -> Set -> Returned Message
         -> PropertiesChanged


M -> Write -> Set -> Returned Message
                  -> PropertiesChanged


















```
system dbus <-- unix socket --> woodstock <-- 
```

DBUS is a binary protocol with its own data types. `woodstock` implements all DBus data types as JavaScript classes. 


A DBus client program could be a user or a provider, or both.

As a user, the client program can invoke methods on or handle signal from the dbus object.

As a provider, the client program can register dbus object onto the bus, providing properties, methods, and signals to be access by other programs.

For example:

1. to access the wpa_supplicant or NetworkManager, the client program could take the *user* role.
2. to provide BLE gatt services, the client program needs to create and register dbus objects, providing standard DBus interfaces such as `org.freedesktop.DBus.ObjectManager` and `org.freedesktop.DBus.Properties`, as well as interface defined by Bluez, such as `org.bluez.GattCharacteristic1`. After registering the dbus object tree on dbus, the client program can tell the Bluez service that new gatt services is available.

# Responsibility

First, `woodstock` should allow the client program to create a dbus client and connect to dbus, either the system bus or a session bus.

If the client program takes a `user` role, it could use `woodstock` to:

1. browse the hierarchy of dbus, like `readdir` does.
2. introspect each dbus object, i.e., list the interface definition.
3. invoke methods or register a signal handler on specific dbus object.

If the client program takes a `provider` role, it could use `woodstock` to:

1. create dbus object and dbus object tree
2. create custom interfaces
3. attach standard or custom interfaces on dbus object
4. register and deregister a dbus object (or a dbus object tree) to the connected bus

> There should be an interface pool, like a flywheel pattern. 

The following standard interfaces are implemented.

## `org.freedesktop.DBus.Introspectable`

### Methods

```
Introspectable.Introspect (out STRING xml_data)
```

## `org.freedesktop.DBus.Properties`

### Methods

```
Properties.Get (in STRING interface_name,
                in STRING property_name,
                out VARIANT value);
Properties.Set (in STRING interface_name,
                in STRING property_name,
                in VARIANT value);
Properties.GetAll (in STRING interface_name,
                   out DICT<STRING,VARIANT> props);
```

### Signals

```
Properties.PropertiesChanged (STRING interface_name,
                              DICT<STRING,VARIANT> changed_properties,
                              ARRAY<STRING> invalidated_properties);
```

## `org.freedesktop.DBus.ObjectManager`

### Methods

```
ObjectManager.GetManagedObjects (
    out DICT<OBJPATH,DICT<STRING, DICT<STRING,VARIANT>>> objpath_interfaces_and_properties);
```
### Signals

```
ObjectManager.InterfacesAdded (
    OBJPATH object_path,
    DICT<STRING,DICT<STRING,VARIANT>> interfaces_and_properties);
ObjectManager.InterfacesRemoved (
    OBJPATH object_path, 
    ARRAY<STRING> interfaces);
```

## `org.freedesktop.DBus`

This is a special interface with several methods and signals for operating or monitoring the whole bus.

# com.example.readwrite

This is a fictional interface used for testing.

The interface has two properties:

- `Read` property is a read-only string.
- `ReadWrite` property is a read-write string.

The interface has one method:

- `Update(name, value)`, `name` could be `Read` or `ReadWrite`, and `value` is a string.

This interface is provided for testing:

1. local and remote access to properties. This is acturally a test on `org.freedesktop.DBus.Properties` interface.
2. local and remote access to `Update` method.
3. negative testing is emphasized.

