/** Preserve the previous driver's pool and I/O limits, including transaction control. */
export function acquireMysqlConnection<T extends { release(): void }>(acquire: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let expired = false;
    const timer = setTimeout(() => { expired = true; reject(new Error('MySQL connection pool timeout')); }, 15_000);
    void Promise.resolve().then(acquire).then(connection => {
      clearTimeout(timer);
      if (expired) connection.release(); else resolve(connection);
    }, error => { clearTimeout(timer); reject(error); });
  });
}

export function mysqlOperation<T>(execute: () => Promise<T>, dispose: () => void): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      try { dispose(); } finally { reject(new Error('MySQL operation timed out')); }
    }, 30_000);
    void Promise.resolve().then(execute).then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
  });
}
