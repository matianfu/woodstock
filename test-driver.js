const DBusDriver = require('./src/dbus-driver')

const driver = new DBusDriver()
driver.on('connect', () => console.log('connect'))
driver.on('invocation', m => console.log('invoke', m))

console.log(driver)
