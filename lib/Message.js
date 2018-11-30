
class Message {
  constructor () {
    

    this.header = [
      new BYTE(),
      new BYTE(),
      new BYTE(),
      new BYTE(),
      new UINT32(),
      new UINT32(),
      new ARRAY('(yv)')
    ]

    this.body = undefined
  }

  push 
}
