/** Component-local property occurrences, with explicit evidence for local renames. */
export class PropertyIdentityStore {
  private identities = new Map<string, string>();
  private sequence = 0;

  reconcile(names: readonly string[]): ReadonlyMap<string, string> {
    const current = new Set(names);
    for (const name of this.identities.keys()) {
      if (!current.has(name)) this.identities.delete(name);
    }
    for (const name of names) {
      if (!this.identities.has(name)) this.identities.set(name, `property-${this.sequence++}`);
    }
    // A rename must not mutate the snapshot used by the still-rendered old list.
    return new Map(this.identities);
  }

  rename(before: string, after: string): void {
    const identity = this.identities.get(before);
    if (identity === undefined || this.identities.has(after)) return;
    this.identities.delete(before);
    this.identities.set(after, identity);
  }
}
