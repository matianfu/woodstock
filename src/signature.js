/**
 * This module has several functions to parse or validate a signature string.
 *
 * @module signature
 */

/**
 * @param {string} sig - a signature string
 * @param {number} start - start position, inclusive
 * @parma {number} end - end position, exclusive
 * @returns the first single complete type
 */
const slice = (sig, start, end) => {
  switch (sig[start]) {
    case 'y': // BYTE
    case 'b': // BOOLEAN
    case 'n': // INT16
    case 'q': // UINT16
    case 'i': // INT32
    case 'u': // UINT32
    case 'x': // INT64
    case 't': // UINT64
    case 'd': // DOUBLE
    case 'h': // UNIX_FD
    case 's': // STRING
    case 'o': // OBJECT_PATH
    case 'g': // SIGNATURE
    case 'v': // VARIANT
      return sig.slice(start, start + 1)
    case 'a':
      return 'a' + slice(sig, start + 1, end)
    case '(': {
      let count = 1
      for (let i = start + 1; i < end; i++) {
        if (sig[i] === '(') {
          count++
        } else if (sig[i] === ')') {
          if (!--count) {
            // validate
            split(sig, start + 1, i)
            return sig.slice(start, i + 1)
          }
        }
      }
      throw new RangeError(`unmatched ( at position ${start}`)
    }
    case '{': { // DICT_ENTRY
      if (start === 0 || sig[start - 1] !== 'a') {
        throw new RangeError(`not an array element type at position ${start}`)
      }
      let count = 1
      for (let i = start + 1; i < end; i++) {
        if (sig[i] === '{') {
          count++
        } else if (sig[i] === '}') {
          if (!--count) {
            const list = split(sig, start + 1, i)
            if (list.length !== 2) {
              throw new RangeError(`not two single complete types at position ${start}`)
            }

            if (!'ybnqiuxtdhsog'.includes(list[0])) {
              throw new Error(`not a basic type at position ${start}`)
            }
            return sig.slice(start, i + 1)
          }
        }
      }

      throw new RangeError(`unmatched { at position ${start}`)
    }
    default:
      throw new RangeError(`invalid character ${sig[start]} at position ${start}`)
  }
}

/**
 * split a list of complete types
 *
 * @param {string} sig - signature string (or sub string)
 * @param {number} start - start position, inclusive
 * @param {number} end - end positin, exclusive
 */
const split = (sig, start, end) => {
  if (typeof sig !== 'string') {
    throw new TypeError('sig not a string')
  }

  if (end === undefined) {
    end = sig.length
    if (start === undefined) {
      start = 0
    }
  }

  start = start || 0
  end = end || sig.length

  if (!Number.isInteger(start)) {
    throw new TypeError('start not an integer')
  }

  if (!Number.isInteger(end)) {
    throw new TypeError('end not an integer')
  }

  if (start < 0 || start >= sig.length) {
    throw new RangeError('start out of range')
  }

  if (end > sig.length || end < start) {
    throw new RangeError('end out of range')
  }

  if (start === end) return []

  const list = []
  while (start < end) {
    const single = slice(sig, start, end)
    list.push(single)
    start += single.length
  }
  return list
}

module.exports = { split, slice }
