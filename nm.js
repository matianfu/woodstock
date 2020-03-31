const NM = require('./demos/nm')

const nm = new NM()

nm.on('ready', () => nm.requestScan())

