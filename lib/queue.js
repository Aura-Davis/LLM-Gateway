export const PRIORITY = {
  premium: 0, 
  standard: 1,
};

export class PriorityQueue {
  constructor() {
    this._heap = [];
    this._seq = 0; 
  }

  get size() {
    return this._heap.length;
  }

  isEmpty() {
    return this._heap.length === 0;
  }

  enqueue(item, priority = PRIORITY.standard) {
    const node = { item, priority, seq: this._seq++ };
    this._heap.push(node);
    this._bubbleUp(this._heap.length - 1);
    return node.seq;
  }

  dequeue() {
    if (this.isEmpty()) return null;
    const top = this._heap[0];
    const last = this._heap.pop();
    if (this._heap.length > 0) {
      this._heap[0] = last;
      this._bubbleDown(0);
    }
    return top.item;
  }

  peek() {
    return this.isEmpty() ? null : this._heap[0].item;
  }

  drainAll() {
    const out = [];
    while (!this.isEmpty()) out.push(this.dequeue());
    return out;
  }

  _compare(a, b) {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.seq - b.seq;
  }

  _bubbleUp(idx) {
    while (idx > 0) {
      const parent = (idx - 1) >> 1;
      if (this._compare(this._heap[idx], this._heap[parent]) < 0) {
        [this._heap[idx], this._heap[parent]] = [this._heap[parent], this._heap[idx]];
        idx = parent;
      } else break;
    }
  }

  _bubbleDown(idx) {
    const n = this._heap.length;
    while (true) {
      let smallest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      if (left < n && this._compare(this._heap[left], this._heap[smallest]) < 0) smallest = left;
      if (right < n && this._compare(this._heap[right], this._heap[smallest]) < 0) smallest = right;
      if (smallest === idx) break;
      [this._heap[idx], this._heap[smallest]] = [this._heap[smallest], this._heap[idx]];
      idx = smallest;
    }
  }
}
