import { useEffect, useRef, useCallback, useState } from 'react';
import { EventBus } from './EventBus';
import { WorkflowCallbacks, WorkflowParams, WorkflowConfig } from './WorkflowAPI';

/**
 * React hook for workflow execution
 * Automatically handles subscription and cleanup
 */
export function useWorkflow<TData = any, TError = any>(
  eventBus: EventBus,
  workflowName: string,
  config?: WorkflowConfig
) {
  const subscriptionIdRef = useRef<string | null>(null);
  const {
    successStates = ['success'],
    errorStates = ['error', 'failure'],
  } = config || {};

  const execute = useCallback(
    (params: WorkflowParams, callbacks: WorkflowCallbacks<TData, TError>) => {
      const { onSuccess, onError, onProgress } = callbacks;

      // Generate unique subscription ID
      const registrationId = `${workflowName}.${Date.now()}.${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      subscriptionIdRef.current = registrationId;

      // Subscribe to state changes
      eventBus.subscribe(
        registrationId,
        `WF.${workflowName}.STATE.CHANGE`,
        (id, topic, eventData) => {
          const state = eventData?.value;

          if (successStates.includes(state)) {
            onSuccess?.(eventData.event?.data);
          } else if (errorStates.includes(state)) {
            onError?.(eventData.event?.data || eventData);
          } else {
            onProgress?.(state, eventData);
          }
        }
      );

      // Send INIT event
      eventBus.send(`WF.${workflowName}.INIT`, {
        header: {
          registrationId,
          workflow: workflowName,
          eventType: 'INIT',
        },
      });

      // Send SUBMIT event
      eventBus.send(`WF.${workflowName}.SUBMIT`, {
        header: {
          registrationId,
          workflow: workflowName,
          eventType: 'SUBMIT',
        },
        body: params,
      });
    },
    [eventBus, workflowName, successStates, errorStates]
  );

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionIdRef.current) {
        eventBus.unsubscribe(subscriptionIdRef.current);
      }
    };
  }, [eventBus]);

  return execute;
}

/**
 * React hook for subscribing to events
 * Automatically handles subscription and cleanup
 */
export function useEventSubscription<T = any>(
  eventBus: EventBus,
  topic: string,
  listener: (data: T) => void,
  deps: any[] = []
) {
  const subscriptionIdRef = useRef<string>(
    `subscription.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`
  );

  useEffect(() => {
    const subscriptionId = subscriptionIdRef.current;

    eventBus.subscribe(
      subscriptionId,
      topic,
      (id, topic, data) => {
        listener(data);
      }
    );

    return () => {
      eventBus.unsubscribe(subscriptionId);
    };
  }, [eventBus, topic, ...deps]);
}

/**
 * React hook for workflow execution with built-in state management
 * Returns loading, error, and data states
 */
export function useWorkflowState<TData = any, TError = any>(
  eventBus: EventBus,
  workflowName: string,
  config?: WorkflowConfig
) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<TError | null>(null);

  const execute = useWorkflow<TData, TError>(eventBus, workflowName, config);

  const run = useCallback(
    (params: WorkflowParams) => {
      setIsLoading(true);
      setError(null);
      setData(null);

      execute(params, {
        onSuccess: (responseData) => {
          setData(responseData);
          setIsLoading(false);
        },
        onError: (err) => {
          setError(err);
          setIsLoading(false);
        },
        onProgress: (state, progressData) => {
          console.log(`Workflow progress: ${state}`, progressData);
        },
      });
    },
    [execute]
  );

  return {
    run,
    isLoading,
    data,
    error,
    reset: () => {
      setIsLoading(false);
      setData(null);
      setError(null);
    },
  };
}

/**
 * React hook for publishing events
 */
export function useEventPublish(eventBus: EventBus) {
  return useCallback(
    <T = any>(topic: string, data: T, metadata?: Record<string, any>) => {
      eventBus.send(topic, data, metadata);
    },
    [eventBus]
  );
}
