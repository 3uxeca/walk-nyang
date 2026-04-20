export class ObjectPool<T> {
  private available: T[] = []
  private factory: () => T
  private reset: (item: T) => void

  constructor(factory: () => T, reset: (item: T) => void) {
    this.factory = factory
    this.reset = reset
  }

  acquire(): T {
    const item = this.available.pop()
    if (item !== undefined) return item
    return this.factory()
  }

  release(item: T) {
    this.reset(item)
    this.available.push(item)
  }

  get size(): number {
    return this.available.length
  }

  clear() {
    this.available.length = 0
  }
}
