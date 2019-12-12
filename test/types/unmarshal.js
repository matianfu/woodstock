const path = require('path')
const expect = require('chai').expect

const {
  LITTLE, BIG, 
  TYPE, BYTE, BOOLEAN, INT16, UINT16, INT32, UINT32, INT64, UINT64,
  DOUBLE, UNIX_FD, STRING, OBJECT_PATH, SIGNATURE, ARRAY, STRUCT,
  DICT_ENTRY, VARIANT
} = require('src/types')

const { decode } = require('src/wire')

const print = buf => {
  while (buf.length) {
    console.log(buf.slice(0, 16))
    buf = buf.slice(16)
  }
}

/**
 * A Signal message from NetworkManager
 * 
 * The message has an empty signature field and ever crashed the 
 * unmarshalling.
 *
 * ```
 * Map {
 *   1 => '/org/freedesktop/NetworkManager/Settings/9',
 *   2 => 'org.freedesktop.NetworkManager.Settings.Connection',
 *   8 => '',
 *   3 => 'Updated',
 *   7 => ':1.16' }
 * ```
 */
const msg001 = `
<Buffer 6c 04 01 01 00 00 00 00 54 30 00 00 9e 00 00 00>
<Buffer 01 01 6f 00 2a 00 00 00 2f 6f 72 67 2f 66 72 65>
<Buffer 65 64 65 73 6b 74 6f 70 2f 4e 65 74 77 6f 72 6b>
<Buffer 4d 61 6e 61 67 65 72 2f 53 65 74 74 69 6e 67 73>
<Buffer 2f 39 00 00 00 00 00 00 02 01 73 00 32 00 00 00>
<Buffer 6f 72 67 2e 66 72 65 65 64 65 73 6b 74 6f 70 2e>
<Buffer 4e 65 74 77 6f 72 6b 4d 61 6e 61 67 65 72 2e 53>
<Buffer 65 74 74 69 6e 67 73 2e 43 6f 6e 6e 65 63 74 69>
<Buffer 6f 6e 00 00 00 00 00 00 08 01 67 00 00 00 00 00>
<Buffer 03 01 73 00 07 00 00 00 55 70 64 61 74 65 64 00>
<Buffer 07 01 73 00 05 00 00 00 3a 31 2e 31 36 00>
`

const hex = msg => msg.split('\n')
                      .map(l => l.trim())
                      .filter(l => !!l.length)
                      .map(l => l.slice(8, -1).split(' ').join(''))
                      .join('')



describe(path.basename(__filename), () => {

  it('unmarshal msg001 (empty signature string allowed)', () => {
    const data = Buffer.from(hex(msg001), 'hex')
    const arr = new ARRAY('a{yv}') 
    arr.unmarshal(data, 12, true)
    const v = arr.eval()
    expect(v.get(8)).to.equal('')
  })
})


