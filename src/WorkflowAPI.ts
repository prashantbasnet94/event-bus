import { EventBus } from './EventBus';

/**
 * Workflow configuration
 */
export interface WorkflowConfig {
  workflow: string;
  datasource?: string;
  successStates?: string[];
  errorStates?: string[];
  responseMapping?: any;
}

/**
 * Workflow callbacks
 */
export interface WorkflowCallbacks<TData = any, TError = any> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
  onProgress?: (state: string, data: any) => void;
}

/**
 * Workflow execution parameters
 */
export interface WorkflowParams {
  datasource?: any;
  request?: any;
  responseMapping?: any;
  [key: string]: any;
}

/**
 * Simplified Workflow API
 * Encapsulates the INIT -> SUBMIT -> STATE.CHANGE pattern
 */
export class WorkflowAPI {
  private eventBus: EventBus;
  private workflowName: string;
  private subscriptionId: string | null = null;

  constructor(eventBus: EventBus, workflowName: string) {
    this.eventBus = eventBus;
    this.workflowName = workflowName;
  }

  /**
   * Execute a workflow with automatic subscription and cleanup
   */
  execute<TData = any, TError = any>(
    params: WorkflowParams,
    callbacks: WorkflowCallbacks<TData, TError>,
    config?: WorkflowConfig
  ): void {
    const {
      onSuccess,
      onError,
      onProgress,
    } = callbacks;

    const {
      successStates = ['success'],
      errorStates = ['error', 'failure'],
    } = config || {};

    // Generate unique subscription ID
    const registrationId = `${this.workflowName}.${Date.now()}.${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    this.subscriptionId = registrationId;

    // Subscribe to state changes
    this.eventBus.subscribe(
      registrationId,
      `WF.${this.workflowName}.STATE.CHANGE`,
      (id, topic, eventData) => {
        const state = eventData?.value;

        if (successStates.includes(state)) {
          onSuccess?.(eventData.event?.data);
          this.cleanup();
        } else if (errorStates.includes(state)) {
          onError?.(eventData.event?.data || eventData);
          this.cleanup();
        } else {
          onProgress?.(state, eventData);
        }
      }
    );

    // Send INIT event
    this.eventBus.send(`WF.${this.workflowName}.INIT`, {
      header: {
        registrationId,
        workflow: this.workflowName,
        eventType: 'INIT',
      },
    });

    // Send SUBMIT event
    this.eventBus.send(`WF.${this.workflowName}.SUBMIT`, {
      header: {
        registrationId,
        workflow: this.workflowName,
        eventType: 'SUBMIT',
      },
      body: params,
    });
  }

  /**
   * Cancel the workflow execution
   */
  cancel(): void {
    this.cleanup();
  }

  /**
   * Cleanup subscription
   */
  private cleanup(): void {
    if (this.subscriptionId) {
      this.eventBus.unsubscribe(this.subscriptionId);
      this.subscriptionId = null;
    }
  }
}

/**
 * Workflow Builder - Fluent API for workflow execution
 */
export class WorkflowBuilder<TData = any, TError = any> {
  private eventBus: EventBus;
  private workflowName: string;
  private params: WorkflowParams = {};
  private successCallback?: (data: TData) => void;
  private errorCallback?: (error: TError) => void;
  private progressCallback?: (state: string, data: any) => void;
  private config?: WorkflowConfig;

  constructor(eventBus: EventBus, workflowName: string) {
    this.eventBus = eventBus;
    this.workflowName = workflowName;
  }

  /**
   * Set workflow parameters
   */
  withParams(params: WorkflowParams): this {
    this.params = params;
    return this;
  }

  /**
   * Set success callback
   */
  onSuccess(callback: (data: TData) => void): this {
    this.successCallback = callback;
    return this;
  }

  /**
   * Set error callback
   */
  onError(callback: (error: TError) => void): this {
    this.errorCallback = callback;
    return this;
  }

  /**
   * Set progress callback
   */
  onProgress(callback: (state: string, data: any) => void): this {
    this.progressCallback = callback;
    return this;
  }

  /**
   * Set workflow configuration
   */
  withConfig(config: WorkflowConfig): this {
    this.config = config;
    return this;
  }

  /**
   * Execute the workflow
   */
  execute(): void {
    const api = new WorkflowAPI(this.eventBus, this.workflowName);

    api.execute(
      this.params,
      {
        onSuccess: this.successCallback,
        onError: this.errorCallback,
        onProgress: this.progressCallback,
      },
      this.config
    );
  }
}

/**
 * Factory function for fluent workflow API
 */
export function workflow(eventBus: EventBus, workflowName: string): WorkflowBuilder {
  return new WorkflowBuilder(eventBus, workflowName);
}
