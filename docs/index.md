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

# Local DBus Object

# Message Flow

```
No  Remote                  LOCAL                   DBus                    User
1   |                       |                       | <-- invoke (remote) - |
2   | <-- METHOD_CALL ----- +---------------------- |                       |
3   | --- METHOD_RETURN or ERROR -----------------> |                       |
4   |                       |                       | --- err/result -----> |
    |                       |                       |                       |
5   | --- SIGNAL -----------+---------------------> | --------------------> |
    |                       |                       |                       |
6   | --- METHOD_CALL ------+---------------------> |                       |
7   |                       | <-- invoke ---------- |                       |
8   |                       | --- err/result -----> |                       |
9   | <-- METHOD_RETURN or ERROR ------------------ |                       |
    |                       |                       |                       |
10  |                       |                       | <-- invoke (local) -- |
11  |                       | <-- invoke ---------- |                       |
12  |                       | --- err/result -----> |                       |
13  |                       |                       | --- err/result -----> |
    |                       |                       |                       |
14  |                       | --- signal ---------> | --------------------> |
15  | <-- SIGNAL -----------+---- (relay) --------- |                       |
```

# Message Format

The following table listed all possible properties for a message object:

The last two properties, `bytesDecoded` and `initiator` are not defined in DBus specification.

|property       |type       | CALL |RETURN|ERROR |SIGNAL|comment|
|---------------|-----------|------|------|------|------|-------|
|le             |boolean    |Y     |Y     |Y     |Y     |
|type           |string     |Y     |Y     |Y     |Y     |
|flags          |object     |Y     |Y     |Y     |Y     |
|version        |number     |Y     |Y     |Y     |Y     |
|serial         |number     |Y     |Y     |Y     |Y     |
|path           |string     |Y     |      |      |Y     |
|interface      |string     |Y     |      |      |Y     |
|member         |string     |Y     |      |      |Y     |
|errorName      |string     |      |      |Y     |      |
|replySerial    |number     |      |Y     |Y     |      |
|destination    |string     |Y     |Y     |Y     |      |
|sender         |string     |Y     |Y     |Y     |Y     |
|signature      |string     |O     |O     |Y     |O     |
|body           |TYPE[]     |O     |O     |Y     |O     |
|
|bytesDecoded   |number     |Y     |Y     |Y     |Y     |unmarshalled mesage
|initiator      |string     |      |      |      |Y     |signal from local DBus object

All properties marked as 'Y' is defined in DBus specification, which means:
1. they are provided in message unmarshalled from socket data
2. they must be provided in message object before marshalling and sending over the socket



All properties marked as `Y` is required for marshalling a message to send, or is present in a message unmarshalled from socket data. In DBus specification, 

`DBus` class provides an `invoke` function to invoke a method on remote object. This function requires user to provide `path`, `interface`, `member`, `destination`, and `signature`/`body` pair optionally. Other properties are filled by `invoke`, `send` or `encode` method internally.





Invoke a remote method
Local method invoked by remote client or service

The following functions provided by `DBus` class requires 
- invoke
- errorReturn
- methodReturn



`bytesDecoded` is a property attached in unmarshalling, mainly for debug usage. `initator` is a property attached to signals emitted from local DBus object.

When only local DBus object is concerned, only properties with bold typeface is 





















|||unmarshalled|send|invoke (api)|
|-|-|-|-|-|
|le|boolean|&#10003;|
|type|string|&#10003;|&#10003;
|flags|object|&#10003;
|version|number|&#10003;
|serial|number|&#10003;
|path|string|&#10003;|&#10003;
|interface|string|&#10003;|&#10003;
|member|string|&#10003;|&#10003;
|destination|string|&#10003;|&#10003;
|sender|string|&#10003;
|signature|string|&#10003;|optional
|body|Array of TYPE|&#10003;|optional
|bytesDecode|number|&#10003;
|initiator|string|

All internal functions pass messages as arguments, including the user-provided interface implementation.

A message may be generated from methods or signals:

For methods:

1. user invokes method on remote DBus object (api)
2. user invokes method on local DBus object (api)
3. remote DBus client/service invokes method on local DBus object (unmarshalled)

All invocations use `invoke()` method on DBus class as the entry point. All invocations are replied with a result or an error.

case 1:
case 2:
case 3:

For Signals:

1. remote DBus objects may send signals. (unmarshalled)
2. local DBus objects possibly emit signals when methods are invoked either by user or by remote DBus client/service, or by internal method such as `addNode` or `removeNode`, such a signal is firstly emitted by DBus instance to user, then broadcasted to DBus.

case 1: signals has a sender other than undefined, empty string, or local name (`myName`).

The local DBus object is better treated as a passive state store. It is updated either by remote service or by local user program. In this way, it is much simpler to implement a local service, such as GATT service in BLE.

To differentiate whether a state is updated by remote object or local user program, we need a separate property, named `initiator`, in signal message. Signals initiated by remote service, either by Set method or by other method which eventually triggers a Set operation, has the `initiator` set to the remote service identifier, aka, the `sender` prop of the original METHOD_CALL message. If the updated is triggered by a method invocation from local user program, the sender should be undefined, null, empty string, or a string equals to `myName`.

If multiple method call is cascaded, for example: a remote invocation takes on 'Write' method first, the message has a sender property set to remote service name, then 'Write' may invoke the Set method by constructing a new message, in this message, the sender property should be duplicated. And finally, when the signal is triggered, such a message is passed to signal function. It is the signal function that generates the initiator message from the sender property.




























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

