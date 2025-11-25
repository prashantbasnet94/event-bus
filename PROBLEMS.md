# Problems with Current EventBus Implementation

This document outlines the problems and limitations with the current EventBus architecture and areas for improvement.

---

## 1. TYPE SAFETY ISSUES

### Problem
```typescript
// No type safety on events
bus.send('USER.LOGIN', { username: 'john' });

// What shape does this data have? TypeScript doesn't know!
bus.subscribe('listener', 'USER.LOGIN', (id, topic, data) => {
  console.log(data.usernmae); // Typo! No error at compile time
});
```

### Impact
- Runtime errors from typos
- No autocomplete for event data
- Hard to refactor (can't find all usages)
- Breaking changes go unnoticed

### Desired Solution
```typescript
// Type-safe events
type Events = {
  'USER.LOGIN': { username: string; timestamp: number };
  'USER.LOGOUT': { username: string };
  'ORDER.PLACED': { orderId: string; items: string[] };
};

// Fully type-safe
bus.send('USER.LOGIN', {
  username: 'john',
  timestamp: Date.now()
}); // ✅ Type-checked

bus.send('USER.LOGIN', {
  usernmae: 'john' // ❌ TypeScript error!
});
```

---

## 2. MAGIC STRING TOPICS

### Problem
```typescript
// Easy to make typos
bus.subscribe('id1', 'WF.paymentWorkflow.STATE.CHANGE', handler);
bus.send('WF.paymentWorkflow.STATE.CHNAGE', data); // Typo! No error

// No discoverability
// How do you know what topics exist?
// How do you know what the naming convention is?
```

### Impact
- Silent failures (event sent but nobody listening)
- Hard to maintain consistency
- No IDE autocomplete
- Difficult for new developers

### Desired Solution
```typescript
// Enum or const for topics
export const Topics = {
  USER: {
    LOGIN: 'USER.LOGIN',
    LOGOUT: 'USER.LOGOUT',
  },
  WORKFLOW: {
    payment: {
      INIT: 'WF.paymentWorkflow.INIT',
      SUBMIT: 'WF.paymentWorkflow.SUBMIT',
      STATE_CHANGE: 'WF.paymentWorkflow.STATE.CHANGE',
    },
  },
} as const;

// Usage with autocomplete
bus.subscribe('id', Topics.WORKFLOW.payment.STATE_CHANGE, handler);
bus.send(Topics.WORKFLOW.payment.STATE_CHANGE, data);
```

---

## 3. NO DEBUGGABILITY

### Problem
```typescript
// Event sent... but nothing happens
bus.send('USER.LOGIN', { username: 'john' });

// Questions you can't answer:
// - Was the event delivered?
// - Who's subscribed to this topic?
// - Did any errors occur in listeners?
// - What's the event history?
// - Why didn't my listener fire?
```

### Impact
- Hard to debug production issues
- No visibility into event flow
- Can't trace event propagation
- No dev tools integration

### Desired Solution
```typescript
// Debug mode
const bus = new EventBus({ debug: true });

// Should show:
// [EventBus] Event sent: USER.LOGIN
// [EventBus] → Listener 1 (analytics)
// [EventBus] → Listener 2 (notifications)
// [EventBus] ✓ Event processed (2 listeners, 45ms)

// Dev tools integration
bus.getEventHistory(); // See all events
bus.getActiveSubscriptions(); // See who's listening
bus.getSubscriptionsForTopic('USER.LOGIN'); // See specific subscribers
```

---

## 4. MEMORY LEAKS

### Problem
```typescript
function MyComponent() {
  useEffect(() => {
    // Subscribe
    bus.subscribe('my-id', 'USER.LOGIN', handler);

    // Forgot to unsubscribe! Memory leak!
    // Especially in React components that mount/unmount
  }, []);
}

// Manual cleanup is error-prone
useEffect(() => {
  bus.subscribe('my-id', 'USER.LOGIN', handler);

  return () => {
    bus.unsubscribe('my-id'); // Easy to forget!
  };
}, []);
```

### Impact
- Memory leaks in SPAs
- Performance degradation over time
- Multiple subscriptions for same component
- Hard to track down

### Desired Solution
```typescript
// Auto-cleanup with React hooks
useEventSubscription('USER.LOGIN', handler); // Auto-unsubscribe on unmount

// Or return cleanup function
const unsubscribe = bus.subscribe('id', 'USER.LOGIN', handler);
unsubscribe(); // Explicit cleanup
```

---

## 5. NO REQUEST VALIDATION

### Problem
```typescript
// No validation that workflow exists
bus.send('WF.nonExistentWorkflow.SUBMIT', data); // Silent failure

// No validation of data structure
bus.send('WF.payment.SUBMIT', {
  wrong: 'data' // Should have 'header' and 'body', but no validation
});
```

### Impact
- Silent failures
- Runtime errors deep in the stack
- Hard to catch misconfigurations

### Desired Solution
```typescript
// Schema validation
const workflowSchema = z.object({
  header: z.object({
    registrationId: z.string(),
    workflow: z.string(),
    eventType: z.string(),
  }),
  body: z.any(),
});

bus.send('WF.payment.SUBMIT', data); // Validates against schema
```

---

## 6. ERROR HANDLING

### Problem
```typescript
bus.subscribe('id', 'USER.LOGIN', (id, topic, data) => {
  throw new Error('Oops!'); // Error is swallowed by RxJS
});

bus.send('USER.LOGIN', { username: 'john' });
// Event sender doesn't know listener failed!
```

### Impact
- Silent failures
- No error propagation
- Hard to debug
- Inconsistent error handling

### Desired Solution
```typescript
// Global error handler
bus.onError((error, event) => {
  console.error(`Error in listener for ${event.topic}:`, error);
  reportToSentry(error);
});

// Or per-subscription error handling
bus.subscribe('id', 'USER.LOGIN', handler, {
  onError: (error) => console.error(error),
});
```

---

## 7. NO MIDDLEWARE/INTERCEPTORS

### Problem
```typescript
// Want to add logging to all events? Can't do it!
// Want to transform data before delivery? Can't do it!
// Want to throttle/debounce events? Can't do it!
// Want to add authentication checks? Can't do it!

// You'd have to wrap every send() call manually
```

### Impact
- No cross-cutting concerns
- Duplicated logging/monitoring code
- Can't add global behavior
- Hard to implement common patterns

### Desired Solution
```typescript
// Middleware pipeline
bus.use((event, next) => {
  console.log(`[Middleware] Event: ${event.topic}`);
  next(event);
});

bus.use((event, next) => {
  // Transform data
  event.data.timestamp = Date.now();
  next(event);
});

bus.use((event, next) => {
  // Authentication check
  if (!isAuthenticated()) {
    throw new Error('Unauthorized');
  }
  next(event);
});
```

---

## 8. TESTING DIFFICULTIES

### Problem
```typescript
// Hard to test components that use EventBus
test('should handle login', () => {
  // How do you mock EventBus?
  // It's a global singleton!

  render(<LoginComponent />);
  // Component uses global `eventBus`
  // Can't inject a mock version
});

// Subscriptions leak between tests
test('test 1', () => {
  bus.subscribe('id', 'USER.LOGIN', handler1);
});

test('test 2', () => {
  // handler1 is still subscribed! Test pollution!
});
```

### Impact
- Hard to write unit tests
- Test pollution
- Need manual cleanup
- Can't isolate tests

### Desired Solution
```typescript
// Dependency injection
function LoginComponent({ eventBus }: { eventBus: EventBus }) {
  // Use injected bus instead of global
}

// Testing
test('should handle login', () => {
  const mockBus = new EventBus();
  render(<LoginComponent eventBus={mockBus} />);

  // Test with mock bus
  mockBus.send('USER.LOGIN', { username: 'test' });
});

// Auto-cleanup between tests
afterEach(() => {
  bus.reset(); // Clear all subscriptions
});
```

---

## 9. NO ASYNC/AWAIT SUPPORT

### Problem
```typescript
// Want to wait for workflow completion? Can't easily!
bus.send('WF.payment.SUBMIT', data);

// Have to manually subscribe and wait
bus.subscribe('id', 'WF.payment.STATE.CHANGE', (id, topic, data) => {
  if (data.value === 'success') {
    // Now what? Can't return a promise
  }
});

// Compare with modern APIs:
const result = await apiCall(); // Clean!
```

### Impact
- Callback hell
- Hard to compose operations
- No async/await syntax
- Clunky workflows

### Desired Solution
```typescript
// Promise-based API
const result = await bus.sendAndWait('WF.payment.SUBMIT', data, {
  successTopic: 'WF.payment.STATE.CHANGE',
  successCondition: (data) => data.value === 'success',
  timeout: 5000,
});

console.log('Workflow completed:', result);

// Or with workflow helper
const result = await workflow(bus, 'payment').execute(params);
```

---

## 10. PERFORMANCE ISSUES

### Problem
```typescript
// All subscriptions are checked for every event
// Even if topic doesn't match

bus.subscribe('id1', 'USER.LOGIN', handler1);
bus.subscribe('id2', 'USER.LOGOUT', handler2);
bus.subscribe('id3', 'ORDER.PLACED', handler3);
// ... 100 more subscriptions

// When you send an event, all 100+ subscriptions are filtered
bus.send('USER.LOGIN', data);
// RxJS filters through all subscriptions sequentially
```

### Impact
- O(n) performance for every event
- Slower with more subscriptions
- No topic indexing
- Wildcard patterns are expensive (regex matching)

### Desired Solution
```typescript
// Topic-based indexing
// Only check subscriptions for relevant topics

// Internal structure:
// {
//   'USER.LOGIN': [handler1, handler2],
//   'USER.LOGOUT': [handler3],
//   'ORDER.PLACED': [handler4]
// }

// O(1) lookup instead of O(n) filtering
```

---

## 11. NO REPLAY/TIME-TRAVEL

### Problem
```typescript
// Events are fire-and-forget
bus.send('USER.LOGIN', data);
// Event is gone after delivery

// Can't:
// - Replay events for debugging
// - Time-travel like Redux DevTools
// - Audit event history
// - Rehydrate state from events
```

### Impact
- Hard to debug
- Can't reproduce issues
- No audit trail
- Can't implement event sourcing

### Desired Solution
```typescript
// Event sourcing mode
const bus = new EventBus({
  persistEvents: true,
  maxEvents: 1000
});

// Replay events
bus.replay(); // Replay all events

// Get history
const history = bus.getEventHistory();

// Time-travel
bus.replayUntil(timestamp);
```

---

## 12. NO SUBSCRIPTION PRIORITIES

### Problem
```typescript
// All listeners are equal
bus.subscribe('analytics', 'ORDER.PLACED', handler1);
bus.subscribe('payment', 'ORDER.PLACED', handler2);

// What if payment MUST run before analytics?
// Can't control execution order!
```

### Impact
- Race conditions
- Unpredictable order
- Hard to ensure dependencies
- Business logic coupling

### Desired Solution
```typescript
// Priority-based execution
bus.subscribe('payment', 'ORDER.PLACED', handler2, { priority: 10 });
bus.subscribe('analytics', 'ORDER.PLACED', handler1, { priority: 1 });

// payment runs first (higher priority)
```

---

## 13. VERBOSE WORKFLOW PATTERN

### Problem
```typescript
// Every workflow requires this boilerplate:
const registrationId = 'workflow.'.concat(Date.now());

bus.subscribe(registrationId, 'WF.workflow.STATE.CHANGE', handler);

bus.send('WF.workflow.INIT', {
  header: { registrationId, workflow: 'workflow', eventType: 'INIT' }
});

bus.send('WF.workflow.SUBMIT', {
  header: { registrationId, workflow: 'workflow', eventType: 'SUBMIT' },
  body: params
});

// Remember to unsubscribe!
bus.unsubscribe(registrationId);

// This is 15+ lines for every workflow!
```

### Impact
- Lots of boilerplate
- Error-prone (easy to forget steps)
- Hard to maintain
- Intimidating for new developers

### Desired Solution
```typescript
// One-liner workflow execution
const result = await workflow(bus, 'payment').execute(params);

// Or with callbacks
workflow(bus, 'payment')
  .withParams(params)
  .onSuccess(handler)
  .execute();
```

---

## 14. NO BATCHING/BUFFERING

### Problem
```typescript
// Sending 1000 events individually
for (let i = 0; i < 1000; i++) {
  bus.send('SENSOR.READING', { value: i });
  // Each triggers all listeners immediately
}

// Would be better to batch:
bus.sendBatch([
  { topic: 'SENSOR.READING', data: { value: 1 } },
  { topic: 'SENSOR.READING', data: { value: 2 } },
  // ... 998 more
]);
// Process once instead of 1000 times
```

### Impact
- Performance issues with high-frequency events
- Excessive function calls
- No debouncing/throttling
- Inefficient for IoT/sensors

### Desired Solution
```typescript
// Buffering strategy
bus.subscribe('logger', 'SENSOR.*', handler, {
  buffer: { time: 1000, count: 100 } // Buffer 100 events or 1 second
});

// Batch sending
bus.sendBatch(events);
```

---

## 15. GLOBAL NAMESPACE POLLUTION

### Problem
```typescript
// All topics share the same namespace
// Team A:
bus.subscribe('id', 'ORDER.PLACED', handlerA);

// Team B (different package):
bus.subscribe('id', 'ORDER.PLACED', handlerB); // Naming collision!

// No topic namespacing
```

### Impact
- Naming collisions
- Hard to organize large codebases
- Teams step on each other
- No isolation

### Desired Solution
```typescript
// Namespaced buses
const teamABus = bus.namespace('team-a');
const teamBBus = bus.namespace('team-b');

teamABus.send('ORDER.PLACED', data); // Scoped to team-a
teamBBus.send('ORDER.PLACED', data); // Scoped to team-b

// Or topic prefixing
bus.subscribe('id', 'team-a:ORDER.PLACED', handler);
```

---

## SUMMARY OF PROBLEMS

| Problem | Severity | Impact | Fix Difficulty |
|---------|----------|--------|----------------|
| No Type Safety | 🔴 High | Runtime errors, hard to refactor | Hard |
| Magic Strings | 🔴 High | Typos, no discoverability | Medium |
| No Debuggability | 🔴 High | Hard to debug production issues | Medium |
| Memory Leaks | 🔴 High | Performance degradation | Easy |
| No Request Validation | 🟡 Medium | Silent failures | Medium |
| Poor Error Handling | 🟡 Medium | Silent failures | Easy |
| No Middleware | 🟡 Medium | Code duplication | Medium |
| Testing Difficulties | 🟡 Medium | Hard to write tests | Easy |
| No Async/Await | 🟡 Medium | Callback hell | Medium |
| Performance Issues | 🟡 Medium | Slower with scale | Hard |
| No Replay | 🟢 Low | Debugging inconvenience | Medium |
| No Priorities | 🟢 Low | Race conditions | Easy |
| Verbose Workflow | 🔴 High | Developer friction | Easy (done!) |
| No Batching | 🟢 Low | IoT performance | Medium |
| Namespace Pollution | 🟡 Medium | Team conflicts | Easy |

---

## NEXT STEPS

We'll create `SOLUTIONS.md` to address each of these problems with concrete implementations.
