const BLE = require('./src/ble')

const ble = new BLE()
ble.on('hello', () => {
})

ble.addGatt('/gatt')
ble.addService({ UUID: '', Primary: false })
ble.add


