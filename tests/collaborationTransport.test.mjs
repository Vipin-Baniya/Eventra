import assert from "node:assert/strict";
import { createCollaborationTransport } from "../src/utils/collaborationTransport.js";

const messages = [];

class FakeBroadcastChannel {
  constructor(name) {
    this.name = name;
    this.onmessage = null;
    FakeBroadcastChannel.instances.push(this);
  }

  postMessage(message) {
    messages.push({ channel: this.name, message });
  }

  close() {}

  emit(message) {
    this.onmessage?.({ data: message });
  }
}

FakeBroadcastChannel.instances = [];

// Existing broadcast test
const transport = createCollaborationTransport("event-42", {
  BroadcastChannelImpl: FakeBroadcastChannel,
  clientId: "client-a",
});

const delivered = transport.broadcast("add", { id: "chair-1" });

assert.equal(delivered, true);

assert.deepEqual(messages[0], {
  channel: "eventra-collaboration-event-42",
  message: {
    action: "add",
    data: { id: "chair-1" },
    roomId: "event-42",
    clientId: "client-a",
  },
});

// Validation tests
let received = false;

createCollaborationTransport("event-42", {
  BroadcastChannelImpl: FakeBroadcastChannel,
  clientId: "client-b",
  onMessage() {
    received = true;
  },
});

const receiver =
  FakeBroadcastChannel.instances[
    FakeBroadcastChannel.instances.length - 1
  ];

// Invalid message should be ignored
receiver.emit({
  invalid: true,
});

assert.equal(received, false);

// Valid message should be processed
receiver.emit({
  action: "move",
  roomId: "event-42",
  clientId: "client-a",
  data: {},
});

assert.equal(received, true);

transport.close();

console.log("collaboration transport tests passed");
