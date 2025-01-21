import { AbstractWorker } from './abstract-worker';

/**
 * Abstract base class for managing a pool of workers.
 * Provides common functionality for worker pool management.
 * @template T - The type of worker being managed
 */
export abstract class AbstractWorkerPool<T> {
  /** Array of worker instances in the pool */
  protected workers: AbstractWorker<T>[] = [];

  /** Set of currently busy workers */
  protected busyWorkers = new Set<AbstractWorker<T>>();

  /** Constructor function for creating new worker instances */
  protected WorkerClass: new () => AbstractWorker<T>;

  /** Name identifier for the worker pool */
  protected name: string;

  /**
   * Creates an instance of AbstractWorkerPool.
   * @param {string} name - Name identifier for the worker pool
   * @param {new () => AbstractWorker<T>} workerClass - Constructor for creating worker instances
   * @param {number} numWorkers - Number of workers to initialize in the pool
   */
  constructor(name: string, workerClass: new () => AbstractWorker<T>, numWorkers = navigator.hardwareConcurrency || 4) {
    this.name = name;
    this.WorkerClass = workerClass;
    this.initializeWorkers(numWorkers);
  }

  /**
   * Initializes the specified number of workers in the pool.
   * @param {number} numWorkers - Number of workers to create
   * @returns {void}
   */
  protected initializeWorkers(numWorkers: number): void {
    for (let i = 0; i < numWorkers; i++) {
      const worker = new this.WorkerClass();
      this.workers.push(worker);
    }
  }

  /**
   * Gets an available worker from the pool.
   * @returns {AbstractWorker<T> | undefined}
   */
  protected getAvailableWorker(): AbstractWorker<T> | undefined {
    return this.workers.find((w) => !this.busyWorkers.has(w));
  }

  public terminate(): void {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.busyWorkers.clear();
  }
}
