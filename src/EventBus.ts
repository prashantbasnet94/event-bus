import { Subject, AsyncSubject, Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

/**
 * Event structure that flows through the bus
 */
export interface Event<T = any> {
  topic: string;
  data: T;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Subscription configuration
 */
export interface SubscriptionConfig {
  id: string;
  topic: string;
  listener: EventListener;
  closure?: any;
  customData?: any;
}

/**
 * Event listener function signature
 */
export type EventListener<T = any> = (
  subscriptionId: string,
  topic: string,
  data: T,
  closure?: any,
  customData?: any
) => void;

/**
 * Modern EventBus implementation with RxJS
 * Provides pub/sub pattern for decoupled communication
 */
export class EventBus {
  private readonly subject: Subject<Event>;
  private readonly subscriptions: Map<string, Subscription>;
  private readonly debug: boolean;
  private readonly eventHistory: Event[];
  private readonly maxHistorySize: number;

  constructor(options?: { debug?: boolean; maxHistorySize?: number }) {
    this.subject = new Subject<Event>();
    this.subscriptions = new Map();
    this.debug = options?.debug || false;
    this.maxHistorySize = options?.maxHistorySize || 100;
    this.eventHistory = [];

    if (this.debug) {
      this.enableDebugMode();
    }
  }

  /**
   * Send/Publish an event to the bus
   */
  send<T = any>(topic: string, data: T, metadata?: Record<string, any>): void {
    const event: Event<T> = {
      topic,
      data,
      timestamp: Date.now(),
      metadata,
    };

    // Store in history
    this.addToHistory(event);

    // Emit event
    this.subject.next(event);

    if (this.debug) {
      console.log(`[EventBus] Sent: ${topic}`, data);
    }
  }

  /**
   * Subscribe to events matching a topic
   * Supports wildcard matching with * character
   */
  subscribe<T = any>(
    subscriptionId: string,
    topic: string,
    listener: EventListener<T>,
    closure?: any,
    customData?: any
  ): void {
    if (this.subscriptions.has(subscriptionId)) {
      console.warn(
        `[EventBus] Subscription with id "${subscriptionId}" already exists. Skipping.`
      );
      return;
    }

    let observable: Observable<Event<T>>;

    // Support wildcard topics
    if (topic.includes('*')) {
      const regex = new RegExp(topic.replace(/\*/g, '.*'), 'i');
      observable = this.subject.pipe(
        filter((event) => regex.test(event.topic))
      ) as Observable<Event<T>>;
    } else {
      observable = this.subject.pipe(
        filter((event) => event.topic === topic)
      ) as Observable<Event<T>>;
    }

    const subscription = observable.subscribe((event) => {
      listener(subscriptionId, event.topic, event.data, closure, customData);
    });

    this.subscriptions.set(subscriptionId, subscription);

    if (this.debug) {
      console.log(`[EventBus] Subscribed: ${subscriptionId} -> ${topic}`);
    }
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);

    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionId);

      if (this.debug) {
        console.log(`[EventBus] Unsubscribed: ${subscriptionId}`);
      }
    }
  }

  /**
   * Request/Reply pattern using AsyncSubject
   * Allows synchronous-style async communication
   */
  request<TRequest = any, TResponse = any>(
    topic: string,
    data: TRequest,
    metadata?: Record<string, any>
  ): Observable<TResponse> {
    const replySubject = new AsyncSubject<TResponse>();

    const requestData = {
      ...data,
      replySub: replySubject,
    };

    this.send(topic, requestData, metadata);

    return replySubject.asObservable();
  }

  /**
   * Get event history (for debugging/replay)
   */
  getHistory(topic?: string): Event[] {
    if (topic) {
      return this.eventHistory.filter((event) => event.topic === topic);
    }
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory.length = 0;
  }

  /**
   * Get all active subscription IDs
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Unsubscribe all subscriptions
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions.clear();

    if (this.debug) {
      console.log('[EventBus] All subscriptions cleared');
    }
  }

  /**
   * Destroy the event bus
   */
  destroy(): void {
    this.unsubscribeAll();
    this.subject.complete();
    this.clearHistory();
  }

  /**
   * Enable debug logging
   */
  private enableDebugMode(): void {
    this.subject.subscribe((event) => {
      console.log(
        `[EventBus Debug] Event: ${event.topic}`,
        event.data,
        `| Subscribers: ${this.subscriptions.size}`
      );
    });
  }

  /**
   * Add event to history with size limit
   */
  private addToHistory(event: Event): void {
    this.eventHistory.push(event);

    // Keep history size in check
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }
}

// Create singleton instance (optional - can also create multiple instances)
export const eventBus = new EventBus({ debug: false, maxHistorySize: 100 });

// Freeze for immutability (like original MessageBus)
Object.freeze(eventBus);
