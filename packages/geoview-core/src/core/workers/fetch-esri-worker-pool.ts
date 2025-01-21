import { AbstractWorkerPool } from './abstract-worker-pool';
import { FetchEsriWorker, FetchEsriWorkerType } from './fetch-esri-worker';
import { QueryParams } from './fetch-esri-worker-script';
import { createWorkerLogger } from './helper/logger-worker';

import { TypeJsonObject } from '@/api/config/types/config-types';

/**
 * Worker pool for managing ESRI fetch operations.
 * Extends AbstractWorkerPool to handle concurrent ESRI service requests.
 *
 * @class FetchEsriWorkerPool
 * @extends {AbstractWorkerPool<FetchEsriWorkerType>}
 */
export class FetchEsriWorkerPool extends AbstractWorkerPool<FetchEsriWorkerType> {
  // Logger instance for the fetch ESRI worker pool
  #logger = createWorkerLogger('FetchEsriWorkerPool');

  /**
   * Creates an instance of FetchEsriWorkerPool.
   * @param {number} [numWorkers=navigator.hardwareConcurrency || 4] - Number of workers to create in the pool
   */
  constructor(numWorkers = navigator.hardwareConcurrency || 4) {
    super('FetchEsriWorkerPool', FetchEsriWorker, numWorkers);
    this.#logger.logInfo('Worker pool created', `Number of workers: ${numWorkers}`);
  }

  /**
   * Initializes all workers in the pool.
   * @async
   * @returns {Promise<void>}
   * @throws {Error} When worker initialization fails
   */
  public async init(): Promise<void> {
    try {
      await Promise.all(this.workers.map((worker) => worker.init()));
      this.#logger.logTrace('Worker pool initialized');
    } catch (error) {
      this.#logger.logError('Worker pool initialization failed', error);
      throw error;
    }
  }

  /**
   * Processes an ESRI query using an available worker from the pool.
   * @param {QueryParams} params - Parameters for the ESRI query
   * @returns {Promise<TypeJsonObject>} The query results
   * @throws {Error} When no workers are available or query processing fails
   */
  public async process(params: QueryParams): Promise<TypeJsonObject> {
    const availableWorker = this.workers.find((w) => !this.busyWorkers.has(w));
    if (!availableWorker) {
      throw new Error('No available workers');
    }

    try {
      this.busyWorkers.add(availableWorker);
      const result = await availableWorker.process(params);
      return result as TypeJsonObject;
    } finally {
      this.busyWorkers.delete(availableWorker);
    }
  }
}
