# Existing Libraries Similar to EventBus

Yes, there are several existing libraries that provide similar functionality! Here's a comparison:

---

## 1. **EventEmitter (Node.js Built-in)**

```javascript
import { EventEmitter } from 'events';

const emitter = new EventEmitter();

emitter.on('user:login', (data) => {
  console.log('User logged in:', data);
});

emitter.emit('user:login', { username: 'john' });
```

**Pros:**
- ✅ Built into Node.js (no dependencies)
- ✅ Simple, well-understood API
- ✅ Widely used

**Cons:**
- ❌ No TypeScript support out of the box
- ❌ No wildcard patterns
- ❌ No workflow patterns
- ❌ No React hooks

---

## 2. **mitt** (Tiny EventEmitter)

https://github.com/developit/mitt

```typescript
import mitt from 'mitt';

const emitter = mitt();

emitter.on('user:login', (data) => {
  console.log('User logged in:', data);
});

emitter.emit('user:login', { username: 'john' });
```

**Pros:**
- ✅ Tiny (200 bytes!)
- ✅ TypeScript support
- ✅ Works in browser
- ✅ Simple API

**Cons:**
- ❌ No workflow patterns
- ❌ No React hooks
- ❌ Very basic features

**Comparison to EventBus:**
- mitt is simpler, EventBus has more features (workflows, React hooks)
- mitt is tiny, EventBus has more dependencies (RxJS)

---

## 3. **RxJS** (Reactive Extensions)

https://rxjs.dev/

```typescript
import { Subject } from 'rxjs';

const bus = new Subject();

bus.subscribe((data) => {
  console.log('Event:', data);
});

bus.next({ type: 'user:login', username: 'john' });
```

**Pros:**
- ✅ Extremely powerful operators
- ✅ Async handling
- ✅ Stream composition
- ✅ TypeScript support

**Cons:**
- ❌ Steep learning curve
- ❌ Verbose for simple use cases
- ❌ No workflow patterns
- ❌ No topic routing

**Comparison to EventBus:**
- EventBus is built ON TOP of RxJS
- EventBus adds topic routing, workflow patterns, and React hooks
- RxJS is more powerful but harder to use

---

## 4. **EventEmitter3**

https://github.com/primus/eventemitter3

```javascript
import EventEmitter from 'eventemitter3';

const emitter = new EventEmitter();

emitter.on('user:login', (data) => {
  console.log('User logged in:', data);
});

emitter.emit('user:login', { username: 'john' });
```

**Pros:**
- ✅ Fast performance
- ✅ Works in browser and Node.js
- ✅ Similar to Node's EventEmitter

**Cons:**
- ❌ No TypeScript
- ❌ No workflow patterns
- ❌ Basic features

---

## 5. **postal.js** (Topic-based Pub/Sub)

https://github.com/postaljs/postal.js

```javascript
import postal from 'postal';

postal.subscribe({
  channel: 'user',
  topic: 'login',
  callback: (data) => {
    console.log('User logged in:', data);
  }
});

postal.publish({
  channel: 'user',
  topic: 'login',
  data: { username: 'john' }
});
```

**Pros:**
- ✅ Topic-based routing (like EventBus!)
- ✅ Channel namespacing
- ✅ Wildcard subscriptions

**Cons:**
- ❌ No TypeScript
- ❌ Last updated 2016 (not maintained)
- ❌ No React hooks
- ❌ No workflow patterns

**Comparison to EventBus:**
- Most similar architecture!
- postal.js is older, not maintained
- EventBus adds TypeScript, React hooks, workflows

---

## 6. **PubSubJS**

https://github.com/mroderick/PubSubJS

```javascript
import PubSub from 'pubsub-js';

PubSub.subscribe('USER.LOGIN', (msg, data) => {
  console.log('User logged in:', data);
});

PubSub.publish('USER.LOGIN', { username: 'john' });
```

**Pros:**
- ✅ Simple API
- ✅ Topic-based (like EventBus)
- ✅ Synchronous and async support

**Cons:**
- ❌ No TypeScript
- ❌ No React hooks
- ❌ Basic features

---

## 7. **Emittery**

https://github.com/sindresorhus/emittery

```typescript
import Emittery from 'emittery';

const emitter = new Emittery();

emitter.on('user:login', (data) => {
  console.log('User logged in:', data);
});

await emitter.emit('user:login', { username: 'john' });
```

**Pros:**
- ✅ TypeScript support
- ✅ Async/await support
- ✅ Modern API
- ✅ Maintained

**Cons:**
- ❌ No workflow patterns
- ❌ No React hooks
- ❌ No topic routing (like 'USER.*')

---

## 8. **EventBus (Android Library - Different)**

https://github.com/greenrobot/EventBus

This is for Android/Java, not JavaScript! Just FYI there's a naming collision.

---

## 9. **Redux Observable / Redux Saga**

https://redux-observable.js.org/

```typescript
// Redux Observable
const loginEpic = (action$) =>
  action$.pipe(
    ofType('USER_LOGIN'),
    mergeMap((action) => apiCall(action.payload))
  );
```

**Pros:**
- ✅ Integrated with Redux
- ✅ Powerful middleware
- ✅ RxJS operators

**Cons:**
- ❌ Requires Redux
- ❌ More complex
- ❌ Not a pure event bus

---

## 10. **Zustand (with subscribeWithSelector)**

https://github.com/pmndrs/zustand

```typescript
import create from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const useStore = create(
  subscribeWithSelector((set) => ({
    user: null,
    login: (user) => set({ user })
  }))
);

// External subscription (like event bus)
useStore.subscribe(
  (state) => state.user,
  (user) => console.log('User changed:', user)
);
```

**Pros:**
- ✅ Modern, maintained
- ✅ React hooks
- ✅ External subscriptions
- ✅ TypeScript

**Cons:**
- ❌ Not a pure event bus (state management)
- ❌ No workflow patterns
- ❌ No topic routing

---

## **COMPARISON TABLE**

| Library | Size | TypeScript | Wildcards | React Hooks | Workflows | Maintained |
|---------|------|------------|-----------|-------------|-----------|------------|
| **EventBus (Ours)** | ~15KB | ✅ | ✅ | ✅ | ✅ | ✅ |
| mitt | 0.2KB | ✅ | ❌ | ❌ | ❌ | ✅ |
| EventEmitter3 | 5KB | ❌ | ❌ | ❌ | ❌ | ✅ |
| postal.js | 12KB | ❌ | ✅ | ❌ | ❌ | ❌ |
| PubSubJS | 2KB | ❌ | ✅ | ❌ | ❌ | ⚠️ |
| Emittery | 3KB | ✅ | ❌ | ❌ | ❌ | ✅ |
| RxJS | 30KB+ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Zustand | 3KB | ✅ | ❌ | ✅ | ❌ | ✅ |

---

## **WHICH SHOULD YOU USE?**

### **Use mitt if:**
- You want the smallest possible solution
- You don't need advanced features
- Simple pub/sub is enough

### **Use EventEmitter3 if:**
- You want Node.js EventEmitter in the browser
- You need fast performance
- You're familiar with EventEmitter API

### **Use RxJS directly if:**
- You need complex stream operators
- You're building reactive applications
- You're comfortable with RxJS

### **Use postal.js if:**
- You need topic routing and channels
- You don't mind using unmaintained library
- You don't need TypeScript

### **Use Emittery if:**
- You want modern async/await API
- You need TypeScript
- You want something maintained

### **Use Zustand if:**
- You need state management + events
- You're building React apps
- You want simple API

### **Use EventBus (Ours) if:**
- You need workflow orchestration (INIT → SUBMIT → STATE.CHANGE)
- You need React hooks + TypeScript + wildcards
- You're building monorepo with packages
- You need all features in one library

---

## **CONCLUSION**

**Our EventBus is a combination of:**
- postal.js (topic routing)
- RxJS (reactive streams)
- Custom workflow patterns (INIT/SUBMIT/STATE.CHANGE)
- React hooks (useWorkflow, useEventSubscription)

**Closest existing library:** postal.js, but it's unmaintained and lacks TypeScript/React support.

**Most popular alternative:** mitt or EventEmitter3 for simple use cases, RxJS for complex ones.

**Our unique value:** Workflow orchestration + React hooks + TypeScript all in one package.
