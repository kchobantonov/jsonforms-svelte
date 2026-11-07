import { isUpdateArrayContext, type UpdateAction, type UpdateArrayContext } from '@jsonforms/core';
import isEqual from 'lodash/isEqual';
import { dataPathSegments } from './dataPath';

/** Form-local occurrence ids. Nothing is written into data or authored UI schemas. */
export class CollectionIdentityStore {
  private identities = new WeakMap<unknown[], readonly string[]>();
  private sequence = 0;

  keys(values: unknown): readonly string[] {
    if (!Array.isArray(values)) return [];
    let keys = this.identities.get(values);
    if (!keys) {
      keys = values.map(() => `item-${this.sequence++}`);
      this.identities.set(values, keys);
    }
    return keys;
  }

  /** Reconcile external data conservatively: only unique object references match. */
  reconcile(before: unknown, after: unknown): void {
    if (Object.is(before, after) || !after || typeof after !== 'object') return;
    if (Array.isArray(after)) {
      if (this.identities.has(after)) return;
      const previous = Array.isArray(before) ? before : [];
      const oldKeys = this.keys(previous);
      const unique = new Map<object, number>();
      const counts = new Map<object, number>();
      previous.forEach((value, index) => {
        if (value && typeof value === 'object') unique.set(value, unique.has(value) ? -1 : index);
      });
      after.forEach((value) => {
        if (value && typeof value === 'object') counts.set(value, (counts.get(value) ?? 0) + 1);
      });
      const keys = after.map((value) => {
        const index = value && typeof value === 'object' ? unique.get(value) : undefined;
        return index !== undefined && index >= 0 && counts.get(value) === 1
          ? oldKeys[index]
          : `item-${this.sequence++}`;
      });
      this.identities.set(after, keys);
      after.forEach((value) => this.reconcile(undefined, value));
    } else {
      for (const key of Object.keys(after)) {
        this.reconcile(this.property(before, key), this.property(after, key));
      }
    }
  }

  /** Apply explicit local operation evidence before publishing the new core state. */
  update(before: unknown, after: unknown, action: UpdateAction): void {
    const segments = dataPathSegments(action.path);
    const visit = (oldValue: unknown, nextValue: unknown, depth: number): void => {
      if (Object.is(oldValue, nextValue)) return;
      if (depth === segments.length) {
        const context = action.context;
        if (
          Array.isArray(oldValue) &&
          Array.isArray(nextValue) &&
          context &&
          isUpdateArrayContext(context)
        ) {
          const order = this.operationOrder(oldValue.length, context);
          const expected = order?.map((index) => oldValue[index]);
          if (expected && context.type === 'ADD') expected.push(...context.values);
          if (order && expected && isEqual(expected, nextValue)) {
            const oldKeys = this.keys(oldValue);
            const keys = order.map((index) => oldKeys[index]);
            if (context.type === 'ADD')
              keys.push(...context.values.map(() => `item-${this.sequence++}`));
            this.identities.set(nextValue, keys);
            order.forEach((index, nextIndex) =>
              this.retainClone(oldValue[index], nextValue[nextIndex]),
            );
            return;
          }
        }
        this.reconcile(oldValue, nextValue);
        return;
      }
      if (
        Array.isArray(oldValue) &&
        Array.isArray(nextValue) &&
        oldValue.length === nextValue.length &&
        /^(0|[1-9][0-9]*)$/u.test(segments[depth]) &&
        oldValue.every(
          (value, index) => String(index) === segments[depth] || isEqual(value, nextValue[index]),
        )
      ) {
        // An explicit descendant edit retains its containing row occurrence.
        this.identities.set(nextValue, this.keys(oldValue));
      }
      const key = segments[depth];
      visit(this.property(oldValue, key), this.property(nextValue, key), depth + 1);
      this.reconcile(oldValue, nextValue);
    };
    visit(before, after, 0);
  }

  private operationOrder(length: number, context: UpdateArrayContext): number[] | undefined {
    const order = Array.from({ length }, (_, index) => index);
    if (context.type === 'REMOVE') {
      const indices = new Set(context.indices);
      if ([...indices].some((index) => !Number.isInteger(index) || index < 0 || index >= length))
        return;
      return order.filter((index) => !indices.has(index));
    }
    if (context.type === 'MOVE') {
      for (const { from, to } of context.moves) {
        if (![from, to].every((index) => Number.isInteger(index) && index >= 0 && index < length))
          return;
        order.splice(to, 0, order.splice(from, 1)[0]);
      }
    }
    return order;
  }

  // Core clones the complete array before applying array commands. The checked
  // command mapping above establishes which unchanged nested subjects survived.
  private retainClone(before: unknown, after: unknown): void {
    if (!after || typeof after !== 'object') return;
    if (Array.isArray(before) && Array.isArray(after)) {
      this.identities.set(after, this.keys(before));
      after.forEach((value, index) => this.retainClone(before[index], value));
    } else {
      for (const key of Object.keys(after))
        this.retainClone(this.property(before, key), this.property(after, key));
    }
  }

  private property(value: unknown, key: string): unknown {
    return value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined;
  }
}

export const CollectionIdentityContextSymbol = Symbol.for('jsonforms-svelte.collection-identity');
