import type { ErrorObject } from 'ajv';

export interface OwnedErrorSnapshot {
  readonly errors: readonly ErrorObject[];
  readonly pending: boolean;
}

/** A generation belongs to one editor instance and one version of its subject. */
export interface OwnedErrorGeneration {
  readonly owner: symbol;
  readonly version: number;
}

export interface OwnedErrorPublisher {
  /** Invalidate previous work, clear this owner's errors and begin a new subject version. */
  begin(instancePath: string, pending?: boolean): OwnedErrorGeneration;
  /** Errors are relative to the owner's current JSON Pointer. Stale results are ignored. */
  publish(
    generation: OwnedErrorGeneration,
    errors: readonly ErrorObject[],
    pending?: boolean,
  ): boolean;
  /** Call only after the caller has matched the same logical subject at its new path. */
  relocate(instancePath: string): void;
  clear(): void;
  dispose(): void;
}

interface OwnerState {
  version: number;
  instancePath: string;
  errors: readonly ErrorObject[];
  pending: boolean;
}

const assertPointer = (pointer: string) => {
  if (pointer !== '' && (!pointer.startsWith('/') || /~(?![01])/u.test(pointer))) {
    throw new Error('An owned error path must be an RFC 6901 JSON Pointer.');
  }
};

/** Form-local ownership; application-supplied errors are deliberately outside this store. */
export class OwnedErrorStore {
  private disposed = false;
  private owners = new Map<symbol, OwnerState>();
  private listeners = new Set<(snapshot: OwnedErrorSnapshot) => void>();
  private current: OwnedErrorSnapshot = { errors: [], pending: false };

  get snapshot(): OwnedErrorSnapshot {
    return this.current;
  }

  subscribe(listener: (snapshot: OwnedErrorSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.current);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.current = {
      errors: [...this.owners.values()].flatMap((state) =>
        state.errors.map((error) => ({
          ...error,
          instancePath: state.instancePath + error.instancePath,
        })),
      ),
      pending: [...this.owners.values()].some((state) => state.pending),
    };
    for (const listener of this.listeners) listener(this.current);
  }

  /** Discard a draft session and invalidate its outstanding asynchronous publications. */
  clear(): void {
    if (this.disposed) return;
    for (const state of this.owners.values()) {
      state.version += 1;
      state.errors = [];
      state.pending = false;
    }
    this.notify();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.owners.clear();
    this.notify();
    this.listeners.clear();
  }

  createOwner(): OwnedErrorPublisher {
    if (this.disposed) throw new Error('Cannot create an owner for a disposed error store.');
    const owner = Symbol('renderer-error-owner');
    let disposed = false;
    const state: OwnerState = { version: 0, instancePath: '', errors: [], pending: false };
    this.owners.set(owner, state);
    const clear = () => {
      if (disposed || this.disposed) return;
      state.version += 1;
      state.errors = [];
      state.pending = false;
      this.notify();
    };
    return {
      begin: (instancePath, pending = false) => {
        assertPointer(instancePath);
        if (disposed || this.disposed)
          throw new Error('Cannot begin work for a disposed error owner.');
        state.version += 1;
        state.instancePath = instancePath;
        state.errors = [];
        state.pending = pending;
        this.notify();
        return { owner, version: state.version };
      },
      publish: (generation, errors, pending = false) => {
        if (
          disposed ||
          this.disposed ||
          generation.owner !== owner ||
          generation.version !== state.version
        ) {
          return false;
        }
        for (const error of errors) assertPointer(error.instancePath);
        state.errors = errors.map((error) => ({ ...error, params: { ...error.params } }));
        state.pending = pending;
        this.notify();
        return true;
      },
      relocate: (instancePath) => {
        assertPointer(instancePath);
        if (disposed || this.disposed || state.instancePath === instancePath) return;
        state.instancePath = instancePath;
        this.notify();
      },
      clear,
      dispose: () => {
        if (disposed || this.disposed) return;
        disposed = true;
        this.owners.delete(owner);
        this.notify();
      },
    };
  }
}

export interface JsonFormsValidityEvent {
  readonly errors: readonly ErrorObject[];
  readonly additionalErrors: readonly ErrorObject[];
  readonly pending: boolean;
  readonly valid: boolean;
}

export const OwnedErrorsContextSymbol = Symbol.for('jsonforms-svelte.owned-errors');
