/**
 * A Signal is not only used in sending or receiving signal
 * via dbus. It is also a good part of programming interface.
 * The dbus client as an emitter is a good place for pub-sub
 * signals.
 *
 * For example, an interface implementation may emit a Signal
 * via `this.bus.emit('signal', ...)`. 
 *
 * One internal handler may subscribe it via a handler, translating
 * the signal into a dbus SIGNAL message and send it to dbus. 
 * An user may also get notified from this signal that an object is 
 * updated. This eliminates the need to define all properties as
 * getter/setter, which is a much cleaner way to implement a stateful
 * dbus interface. 
 *
 * A basic signal format is defined by type `Signal`. It includes
 * neccessary fields and data formats as DBus, but not all.
 *
 * If the signal is directly received from DBus, the sender field remains.
 *
 * If the signal comes from an internal interface method, for example,
 * an `org.freedesktop.DBus.Properties.Set()` method will update a Property
 * and signal a `org.freedesktop.DBus.Properties.PropertiesChanged` signal,
 * the sender is filled with the sender from the original METHOD_CALL message. 
 *
 * It is recommended the user also use the Set method to update a Property.
 * In simple case, the user should fake a METHOD_CALL message with empty 
 * sender, or with a custom sender name blacklisted by the handler who is
 * responsible for broadcast the signal on dbus.
 * 
 * @module
 */


/**
 * 
 * @typedef Signal
 * @property {string} path - object path
 * @property {string} interface - interface name
 * @property {string} member - signal name
 * @property {string} signature -
 * @property {TYPE[]} body -
 * @property {string} [sender] - signals received from DBus have this field
 * @property {string} [reason] - signals emitted internally have this field,
 *                               including a METHOD_CALL 
 */


