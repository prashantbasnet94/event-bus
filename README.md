# EventBus - Modern Event-Driven Communication

A modern, type-safe event bus implementation with workflow orchestration support, built on RxJS.

## 🎯 What is EventBus?

EventBus is a **publish-subscribe (pub/sub) messaging system** that enables decoupled communication between components in your application.

Think of it as a **central notification system** where:
- Components can **publish** events without knowing who's listening
- Components can **subscribe** to events without knowing who's publishing
- Multiple components can react to the same event independently

## 📦 Installation

```bash
npm install @modern/event-bus
```

## 🚀 Quick Start

### Basic Pub/Sub

```typescript
import { EventBus } from '@modern/event-bus';

const bus = new EventBus();

// Subscribe to events
bus.subscribe('my-listener', 'USER.LOGIN', (id, topic, data) => {
  console.log(`User logged in: ${data.username}`);
});

// Publish events
bus.send('USER.LOGIN', { username: 'john.doe', timestamp: Date.now() });
```

### React Hooks

```typescript
import { eventBus, useWorkflowState } from '@modern/event-bus';

function PaymentProcessing() {
  const { run, isLoading, data, error } = useWorkflowState(
    eventBus,
    'paymentWorkflow'
  );

  const handlePayment = () => {
    run({
      datasource: 'payment-api',
      request: { params: { orderId: 'ORD123' } }
    });
  };

  return (
    <div>
      <button onClick={handlePayment} disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Process Payment'}
      </button>
      {data && <div>Success! Transaction ID: {data.transactionId}</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

### Workflow API

```typescript
import { eventBus, workflow } from '@modern/event-bus';

// Fluent API
workflow(eventBus, 'paymentWorkflow')
  .withParams({
    datasource: 'payment-api',
    request: { params: { orderId: 'ORD123' } }
  })
  .onSuccess(data => console.log('Success!', data))
  .onError(error => console.error('Failed!', error))
  .execute();
```

## 🌟 Features

### ✅ Current Features

- **Modern RxJS-based** - Built on RxJS 7.x
- **TypeScript Support** - Full type definitions included
- **Wildcard Topics** - Subscribe to multiple events with `USER.*`
- **Request/Reply Pattern** - Synchronous-style async communication
- **React Hooks** - `useWorkflow`, `useEventSubscription`, `useWorkflowState`
- **Workflow Helpers** - Simplified workflow execution
- **Event History** - Debug mode with event replay
- **Memory Management** - Proper subscription cleanup
- **Fluent API** - Builder pattern for workflows

### 🔧 Improvements Over Original MessageBus

| Feature | Original MessageBus | Modern EventBus |
|---------|-------------------|-----------------|
| TypeScript | ❌ No | ✅ Full support |
| React Hooks | ❌ No | ✅ Multiple hooks |
| Workflow Helpers | ❌ No | ✅ WorkflowAPI, Builder |
| Event History | ❌ No | ✅ Built-in |
| Debug Mode | ❌ No | ✅ Console logging |
| Documentation | ❌ Minimal | ✅ Comprehensive |
| Examples | ❌ No | ✅ Multiple examples |

## 📚 API Reference

### EventBus Class

```typescript
class EventBus {
  constructor(options?: { debug?: boolean; maxHistorySize?: number });

  // Core methods
  send<T>(topic: string, data: T, metadata?: Record<string, any>): void;
  subscribe<T>(id: string, topic: string, listener: EventListener<T>, closure?: any, customData?: any): void;
  unsubscribe(id: string): void;
  unsubscribeAll(): void;

  // Request/Reply
  request<TRequest, TResponse>(topic: string, data: TRequest, metadata?: Record<string, any>): Observable<TResponse>;

  // Debugging
  getHistory(topic?: string): Event[];
  clearHistory(): void;
  getActiveSubscriptions(): string[];

  // Cleanup
  destroy(): void;
}
```

### React Hooks

```typescript
// Execute workflows with manual state management
function useWorkflow<TData, TError>(
  eventBus: EventBus,
  workflowName: string,
  config?: WorkflowConfig
): (params: WorkflowParams, callbacks: WorkflowCallbacks<TData, TError>) => void;

// Execute workflows with automatic state management
function useWorkflowState<TData, TError>(
  eventBus: EventBus,
  workflowName: string,
  config?: WorkflowConfig
): {
  run: (params: WorkflowParams) => void;
  isLoading: boolean;
  data: TData | null;
  error: TError | null;
  reset: () => void;
};

// Subscribe to events
function useEventSubscription<T>(
  eventBus: EventBus,
  topic: string,
  listener: (data: T) => void,
  deps?: any[]
): void;

// Publish events
function useEventPublish(
  eventBus: EventBus
): <T>(topic: string, data: T, metadata?: Record<string, any>) => void;
```

### Workflow API

```typescript
// Class-based
const api = new WorkflowAPI(eventBus, 'workflowName');
api.execute(params, callbacks, config);

// Fluent builder
workflow(eventBus, 'workflowName')
  .withParams(params)
  .onSuccess(callback)
  .onError(callback)
  .onProgress(callback)
  .withConfig(config)
  .execute();
```

## 📖 Examples

See the [examples](./examples) directory for comprehensive usage examples:

- [basic-usage.ts](./examples/basic-usage.ts) - Basic pub/sub patterns
- [workflow-usage.ts](./examples/workflow-usage.ts) - Workflow orchestration
- [react-usage.tsx](./examples/react-usage.tsx) - React integration

## ⚠️ Known Problems

See [PROBLEMS.md](./PROBLEMS.md) for a comprehensive list of current limitations and areas for improvement.

## 🎯 When to Use EventBus

### ✅ Good Use Cases

- **Workflow orchestration** - Multi-step async processes
- **Cross-package communication** - Monorepo packages that shouldn't depend on each other
- **Event-driven architecture** - Multiple components reacting to same event
- **Plugin systems** - Third-party extensions
- **Microservices communication** - Distributed systems (with message broker backend)

### ❌ Not Recommended For

- Simple parent-child component communication (use props)
- UI state management (use Redux/Zustand/Context)
- Simple API calls (use TanStack Query)
- Small apps with few components

## 🔍 Comparison with Alternatives

### vs Redux
- **Redux**: Centralized state management with time-travel debugging
- **EventBus**: Decoupled event communication with no persistent state

### vs Context API
- **Context**: Provider/Consumer pattern with React tree scope
- **EventBus**: Global pub/sub with no tree structure dependency

### vs TanStack Query
- **TanStack Query**: Server state management with caching
- **EventBus**: Event-driven communication layer

## 🤝 Contributing

This is a learning project to understand and improve upon the MessageBus pattern. Contributions welcome!

## 📄 License

MIT

## 🙏 Acknowledgments

Inspired by enterprise message bus patterns and workflow orchestration systems.

---

**Note**: This is a modern rewrite and improvement of an existing MessageBus system. See PROBLEMS.md for known issues and planned improvements.
