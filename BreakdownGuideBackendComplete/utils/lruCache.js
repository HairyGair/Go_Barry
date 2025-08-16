class Node {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

export default class LRUCache {
  constructor(maxEntries = 500, ttl = 15 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.ttl = ttl;
    this.cache = new Map();
    this.head = null;
    this.tail = null;
  }

  _isExpired(node) {
    return Date.now() - node.value.timestamp > this.ttl;
  }

  _remove(node) {
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (node === this.head) this.head = node.next;
    if (node === this.tail) this.tail = node.prev;
    node.prev = null;
    node.next = null;
  }

  _addToHead(node) {
    node.next = this.head;
    node.prev = null;
    if (this.head) this.head.prev = node;
    this.head = node;
    if (!this.tail) this.tail = node;
  }

  _moveToHead(node) {
    if (node === this.head) return;
    this._remove(node);
    this._addToHead(node);
  }

  _evict() {
    if (!this.tail) return;
    this.cache.delete(this.tail.key);
    this._remove(this.tail);
  }

  get(key) {
    const node = this.cache.get(key);
    if (!node) return null;
    if (this._isExpired(node)) {
      this.cache.delete(key);
      this._remove(node);
      return null;
    }
    this._moveToHead(node);
    return node.value.data;
  }

  set(key, data) {
    let node = this.cache.get(key);
    if (node) {
      node.value = { data, timestamp: Date.now() };
      this._moveToHead(node);
    } else {
      node = new Node(key, { data, timestamp: Date.now() });
      this.cache.set(key, node);
      this._addToHead(node);
      if (this.cache.size > this.maxEntries) {
        this._evict();
      }
    }
  }

  clear() {
    this.cache.clear();
    this.head = null;
    this.tail = null;
  }

  size() {
    return this.cache.size;
  }
}
