const hello = async () => {
  process.nextTick(() => console.log('next tick before hello'))
  console.log('hello')
  process.nextTick(() => console.log('next tick after hello'))
}

const world = async () => {
  process.nextTick(() => console.log('next tick before world'))
  console.log('world')
  process.nextTick(() => console.log('next tick after world'))
}

const foo = async () => {
  process.nextTick(() => console.log('next tick before foo'))
  console.log('foo')
  process.nextTick(() => console.log('next tick after foo'))
}

const bar = async () => {
  process.nextTick(() => console.log('next tick before bar'))
  console.log('bar')
  process.nextTick(() => console.log('next tick after bar'))
}

const main = async () => {
  await Promise.resolve()
  await hello()
  await world()
  await foo()
  await bar()
}

main().then(() => {}).catch(e => console.log(e))


