import { EventBus } from '../src/EventBus';
import { WorkflowAPI, workflow } from '../src/WorkflowAPI';

// Create EventBus
const bus = new EventBus({ debug: true });

// ===== EXAMPLE 1: WorkflowAPI (Class-based) =====

console.log('\n===== EXAMPLE 1: WorkflowAPI (Class-based) =====\n');

// Simulate a workflow state machine (normally handled by WorkflowProvider)
bus.subscribe(
  'payment-workflow-handler',
  'WF.paymentWorkflow.*',
  (id, topic, data) => {
    console.log(`[Workflow Engine] Received: ${topic}`);

    if (topic.endsWith('.INIT')) {
      console.log('[Workflow Engine] Workflow initialized');
    }

    if (topic.endsWith('.SUBMIT')) {
      console.log('[Workflow Engine] Processing request:', data.body);

      // Simulate async API call
      setTimeout(() => {
        // Send success response
        bus.send('WF.paymentWorkflow.STATE.CHANGE', {
          value: 'success',
          event: {
            data: {
              transactionId: 'TXN123',
              status: 'completed',
            },
          },
        });
      }, 1000);
    }
  }
);

// Use WorkflowAPI
const paymentAPI = new WorkflowAPI(bus, 'paymentWorkflow');

paymentAPI.execute(
  {
    datasource: 'payment-api',
    request: { params: { orderId: 'ORD123' } },
  },
  {
    onSuccess: (data) => {
      console.log('[Component] Payment processed successfully!', data);
    },
    onError: (error) => {
      console.error('[Component] Payment failed:', error);
    },
    onProgress: (state, data) => {
      console.log('[Component] Workflow in progress:', state);
    },
  }
);

// ===== EXAMPLE 2: Workflow Builder (Fluent API) =====

setTimeout(() => {
  console.log('\n===== EXAMPLE 2: Workflow Builder (Fluent API) =====\n');

  // Simulate another workflow
  bus.subscribe(
    'inventory-workflow-handler',
    'WF.inventoryWorkflow.*',
    (id, topic, data) => {
      if (topic.endsWith('.SUBMIT')) {
        setTimeout(() => {
          bus.send('WF.inventoryWorkflow.STATE.CHANGE', {
            value: 'success',
            event: { data: { updated: true, stock: 95 } },
          });
        }, 500);
      }
    }
  );

  // Use fluent API
  workflow(bus, 'inventoryWorkflow')
    .withParams({
      datasource: 'inventory-api',
      request: { productId: 'PROD456' },
    })
    .onSuccess((data) => {
      console.log('[Component] Inventory updated successfully!', data);
    })
    .onError((error) => {
      console.error('[Component] Update failed:', error);
    })
    .execute();
}, 2000);

// ===== EXAMPLE 3: Custom Success/Error States =====

setTimeout(() => {
  console.log('\n===== EXAMPLE 3: Custom Success/Error States =====\n');

  // Workflow with custom states
  bus.subscribe(
    'custom-workflow-handler',
    'WF.customWorkflow.*',
    (id, topic, data) => {
      if (topic.endsWith('.SUBMIT')) {
        setTimeout(() => {
          bus.send('WF.customWorkflow.STATE.CHANGE', {
            value: 'COMPLETED', // Custom success state
            event: { data: { status: 'all done!' } },
          });
        }, 300);
      }
    }
  );

  const customAPI = new WorkflowAPI(bus, 'customWorkflow');

  customAPI.execute(
    { request: { data: 'test' } },
    {
      onSuccess: (data) => {
        console.log('[Component] Custom workflow completed!', data);
      },
    },
    {
      workflow: 'customWorkflow',
      successStates: ['COMPLETED', 'DONE', 'FINISHED'],
      errorStates: ['FAILED', 'ERROR', 'REJECTED'],
    }
  );
}, 3000);

// Cleanup after examples
setTimeout(() => {
  console.log('\n===== Cleaning up =====\n');
  bus.unsubscribeAll();
}, 4000);
