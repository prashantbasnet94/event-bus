import React, { useState } from 'react';
import {
  eventBus,
  useWorkflow,
  useWorkflowState,
  useEventSubscription,
  useEventPublish,
} from '../src';

// ===== EXAMPLE 1: useWorkflow Hook =====

function PaymentComponent() {
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);

  const processPayment = useWorkflow(eventBus, 'paymentWorkflow');

  const handlePayment = () => {
    processPayment(
      {
        datasource: 'payment-api',
        request: { params: { orderId: 'ORD123' } },
      },
      {
        onSuccess: (data) => {
          console.log('Payment processed!', data);
          setPaymentData(data);
        },
        onError: (err) => {
          console.error('Payment failed:', err);
          setError(err);
        },
      }
    );
  };

  return (
    <div>
      <h2>Payment Processing</h2>
      <button onClick={handlePayment}>Process Payment</button>
      {paymentData && <div>Success! Transaction: {paymentData.transactionId}</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}

// ===== EXAMPLE 2: useWorkflowState Hook (with built-in state) =====

function PaymentSimple() {
  const { run, isLoading, data, error } = useWorkflowState(
    eventBus,
    'paymentWorkflow'
  );

  const handlePayment = () => {
    run({
      datasource: 'payment-api',
      request: { params: { orderId: 'ORD123' } },
    });
  };

  return (
    <div>
      <h2>Payment Processing (Simple)</h2>
      <button onClick={handlePayment} disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Process Payment'}
      </button>
      {data && <div>Success! Transaction: {data.transactionId}</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}

// ===== EXAMPLE 3: useEventSubscription Hook =====

function ProductListComponent() {
  const [products, setProducts] = useState([]);

  // Listen to product updates
  useEventSubscription(
    eventBus,
    'PRODUCT.UPDATED',
    (data) => {
      console.log('Product updated:', data);
      // Refresh product list
      setProducts((prev) => [...prev, data]);
    },
    [] // dependencies
  );

  return (
    <div>
      <h2>Product List</h2>
      <ul>
        {products.map((product, i) => (
          <li key={i}>{product.name}</li>
        ))}
      </ul>
    </div>
  );
}

// ===== EXAMPLE 4: useEventPublish Hook =====

function OrderComponent() {
  const publish = useEventPublish(eventBus);

  const placeOrder = () => {
    publish('ORDER.PLACED', {
      orderId: '12345',
      items: ['item1', 'item2'],
      total: 99.99,
    });
  };

  return (
    <div>
      <h2>Order Component</h2>
      <button onClick={placeOrder}>Place Order</button>
    </div>
  );
}

// ===== EXAMPLE 5: Multiple components reacting to same event =====

function AnalyticsComponent() {
  const [events, setEvents] = useState([]);

  useEventSubscription(
    eventBus,
    'ORDER.*', // Wildcard - listen to all order events
    (data) => {
      setEvents((prev) => [...prev, data]);
    }
  );

  return (
    <div>
      <h3>Analytics Dashboard</h3>
      <p>Total events: {events.length}</p>
    </div>
  );
}

function NotificationComponent() {
  const [notifications, setNotifications] = useState([]);

  useEventSubscription(
    eventBus,
    'ORDER.PLACED',
    (data) => {
      setNotifications((prev) => [
        ...prev,
        `Order ${data.orderId} placed successfully!`,
      ]);
    }
  );

  return (
    <div>
      <h3>Notifications</h3>
      {notifications.map((notif, i) => (
        <div key={i}>{notif}</div>
      ))}
    </div>
  );
}

// ===== Main App =====

function App() {
  return (
    <div>
      <h1>EventBus React Examples</h1>

      <PaymentComponent />
      <hr />

      <PaymentSimple />
      <hr />

      <ProductListComponent />
      <hr />

      <OrderComponent />
      <AnalyticsComponent />
      <NotificationComponent />
    </div>
  );
}

export default App;
