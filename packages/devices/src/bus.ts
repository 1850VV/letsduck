/** Serial ownership of the one physical bus; callers must not reacquire inside a job. */
export class IoBus {
  private tail: Promise<void> = Promise.resolve();
  run<T>(operation: () => Promise<T>): Promise<T> {
    const task = this.tail.then(operation);
    this.tail = task.then(() => {}, () => {});
    return task;
  }
  idle(): Promise<void> { return this.tail; }
}
