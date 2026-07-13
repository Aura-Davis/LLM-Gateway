import { PriorityQueue, PRIORITY } from "./queue.js";

const q = new PriorityQueue();
q.enqueue("standard-1", PRIORITY.standard);
q.enqueue("premium-1", PRIORITY.premium);
q.enqueue("standard-2", PRIORITY.standard);
q.enqueue("premium-2", PRIORITY.premium);

const order = q.drainAll();
console.log("Dispatch order:", order);

const expected = ["premium-1", "premium-2", "standard-1", "standard-2"];
const pass = JSON.stringify(order) === JSON.stringify(expected);
console.log(pass ? "PASS ✅" : "FAIL ❌ — expected " + JSON.stringify(expected));
process.exit(pass ? 0 : 1);
