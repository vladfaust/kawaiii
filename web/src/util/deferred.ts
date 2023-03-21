import { ref, Ref } from "vue";

/**
 * A Vue-compatible Promise wrapper that allows for the promise
 * to be resolved or rejected later.
 */
export class Deferred<T> {
  private readonly _promise: Promise<T>;
  private _resolve!: (value: T | PromiseLike<T>) => void;
  private _reject!: (reason?: any) => void;
  private readonly _ref: Ref<T | undefined> = ref();
  readonly resolved: Ref<boolean> = ref(false);

  static from<T>(promise: Promise<T>): Deferred<T> {
    const deferred = new Deferred<T>();
    promise.then(deferred.resolve, deferred.reject);
    return deferred;
  }

  constructor() {
    this._promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  get promise(): Promise<T> {
    return this._promise;
  }

  get value(): T | undefined {
    return this._ref.value;
  }

  resolve = (value: T | PromiseLike<T>): void => {
    if (value instanceof Promise) {
      value.then(this.resolve, this.reject);
      return;
    } else {
      this._ref.value = value as T;
    }

    this._resolve(value);
    this.resolved.value = true;
  };

  reject = (reason?: any): void => {
    this._reject(reason);
    this.resolved.value = true;
  };
}
