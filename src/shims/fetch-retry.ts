type RetryDelayFn = (
  attempt: number,
  error: unknown,
  response: Response | null
) => number;

type RetryOnFn = (
  attempt: number,
  error: unknown,
  response: Response | null
) => boolean | Promise<boolean>;

interface FetchRetryOptions {
  retries: number;
  retryDelay: number | RetryDelayFn;
  retryOn: number[] | RetryOnFn;
}

type FetchRetryInit = RequestInit &
  Partial<Pick<FetchRetryOptions, 'retries' | 'retryDelay' | 'retryOn'>>;

const BASE_DEFAULTS: FetchRetryOptions = {
  retries: 3,
  retryDelay: 1000,
  retryOn: [],
};

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function validateOptions(options: Partial<FetchRetryOptions>) {
  if (options.retries !== undefined && !isPositiveInteger(options.retries)) {
    throw new Error('retries must be a positive integer');
  }

  if (
    options.retryDelay !== undefined &&
    !isPositiveInteger(options.retryDelay) &&
    typeof options.retryDelay !== 'function'
  ) {
    throw new Error(
      'retryDelay must be a positive integer or a function returning a positive integer'
    );
  }

  if (
    options.retryOn !== undefined &&
    !Array.isArray(options.retryOn) &&
    typeof options.retryOn !== 'function'
  ) {
    throw new Error('retryOn property expects an array or function');
  }
}

export default function createFetchRetry(
  fetchImpl: typeof fetch,
  defaults: Partial<FetchRetryOptions> = {}
) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch must be a function');
  }

  if (typeof defaults !== 'object' || defaults === null) {
    throw new Error('defaults must be an object');
  }

  validateOptions(defaults);

  const mergedDefaults: FetchRetryOptions = {
    ...BASE_DEFAULTS,
    ...defaults,
  };

  return async function fetchRetry(
    input: RequestInfo | URL,
    init: FetchRetryInit = {}
  ) {
    validateOptions(init);

    let retries = init.retries ?? mergedDefaults.retries;
    let retryDelay = init.retryDelay ?? mergedDefaults.retryDelay;
    let retryOn = init.retryOn ?? mergedDefaults.retryOn;

    return new Promise<Response>((resolve, reject) => {
      const wrappedFetch = (attempt: number) => {
        const request =
          typeof Request !== 'undefined' && input instanceof Request
            ? input.clone()
            : input;
        fetchImpl(request, init)
          .then(async response => {
            if (Array.isArray(retryOn)) {
              if (retryOn.includes(response.status) && attempt < retries) {
                retry(attempt, null, response);
              } else {
                resolve(response);
              }
              return;
            }

            try {
              const shouldRetry = await retryOn(attempt, null, response);
              if (shouldRetry && attempt < retries) {
                retry(attempt, null, response);
              } else {
                resolve(response);
              }
            } catch (error) {
              reject(error);
            }
          })
          .catch(async error => {
            if (Array.isArray(retryOn)) {
              if (attempt < retries) {
                retry(attempt, error, null);
              } else {
                reject(error);
              }
              return;
            }

            try {
              const shouldRetry = await retryOn(attempt, error, null);
              if (shouldRetry && attempt < retries) {
                retry(attempt, error, null);
              } else {
                reject(error);
              }
            } catch (retryError) {
              reject(retryError);
            }
          });
      };

      const retry = (
        attempt: number,
        error: unknown,
        response: Response | null
      ) => {
        const delay =
          typeof retryDelay === 'function'
            ? retryDelay(attempt, error, response)
            : retryDelay;

        setTimeout(() => wrappedFetch(attempt + 1), delay);
      };

      wrappedFetch(0);
    });
  };
}
