import { EventBus } from '../src/EventBus';

// Create an EventBus instance
const bus = new EventBus({ debug: true });

// ===== EXAMPLE 1: Basic Pub/Sub =====

console.log('\n===== EXAMPLE 1: Basic Pub/Sub =====\n');

// Subscribe to an event
bus.subscribe(
  'user-listener',
  'USER.LOGIN',
  (id, topic, data) => {
    console.log(`User logged in: ${data.username}`);
  }
);

// Publish an event
bus.send('USER.LOGIN', { username: 'john.doe', timestamp: Date.now() });

// ===== EXAMPLE 2: Wildcard Subscriptions =====

console.log('\n===== EXAMPLE 2: Wildcard Subscriptions =====\n');

// Listen to all user events
bus.subscribe(
  'user-wildcard-listener',
  'USER.*',
  (id, topic, data) => {
    console.log(`User event occurred: ${topic}`, data);
  }
);

bus.send('USER.LOGIN', { username: 'jane.doe' });
bus.send('USER.LOGOUT', { username: 'jane.doe' });
bus.send('USER.UPDATE_PROFILE', { username: 'jane.doe', avatar: 'new.jpg' });

// ===== EXAMPLE 3: Multiple Listeners =====

console.log('\n===== EXAMPLE 3: Multiple Listeners =====\n');

// Analytics listener
bus.subscribe(
  'analytics',
  'ORDER.PLACED',
  (id, topic, data) => {
    console.log('[Analytics] Order tracked:', data.orderId);
  }
);

// Email listener
bus.subscribe(
  'email',
  'ORDER.PLACED',
  (id, topic, data) => {
    console.log('[Email] Sending confirmation to:', data.email);
  }
);

// Inventory listener
bus.subscribe(
  'inventory',
  'ORDER.PLACED',
  (id, topic, data) => {
    console.log('[Inventory] Decrementing stock for:', data.items);
  }
);

// One event, three listeners react
bus.send('ORDER.PLACED', {
  orderId: '12345',
  email: 'customer@example.com',
  items: ['item1', 'item2'],
});

// ===== EXAMPLE 4: Request/Reply Pattern =====

console.log('\n===== EXAMPLE 4: Request/Reply Pattern =====\n');

// Subscriber that replies
bus.subscribe(
  'calculator',
  'MATH.ADD',
  (id, topic, data) => {
    const result = data.a + data.b;
    console.log(`[Calculator] ${data.a} + ${data.b} = ${result}`);

    // Reply back through replySub
    if (data.replySub) {
      data.replySub.next(result);
      data.replySub.complete();
    }
  }
);

// Requester
bus.request('MATH.ADD', { a: 5, b: 3 }).subscribe((result) => {
  console.log(`[Requester] Received result: ${result}`);
});

// ===== EXAMPLE 5: Event History =====

console.log('\n===== EXAMPLE 5: Event History =====\n');

bus.send('TEST.EVENT1', { message: 'First event' });
bus.send('TEST.EVENT2', { message: 'Second event' });
bus.send('TEST.EVENT3', { message: 'Third event' });

console.log('Event history:', bus.getHistory());
console.log('TEST events only:', bus.getHistory('TEST.EVENT1'));

// ===== EXAMPLE 6: Cleanup =====

console.log('\n===== EXAMPLE 6: Cleanup =====\n');

bus.subscribe('temp-listener', 'TEMP.EVENT', (id, topic, data) => {
  console.log('Temporary listener received:', data);
});

console.log('Active subscriptions:', bus.getActiveSubscriptions());

bus.unsubscribe('temp-listener');

console.log('After unsubscribe:', bus.getActiveSubscriptions());

// Cleanup
setTimeout(() => {
  console.log('\n===== Cleaning up all subscriptions =====\n');
  bus.unsubscribeAll();
  console.log('Active subscriptions:', bus.getActiveSubscriptions());
}, 1000);
