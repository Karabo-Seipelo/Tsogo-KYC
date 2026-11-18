export interface SessionStore {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  getDel(key: string): Promise<unknown>;
  expire(key: string, ttlSeconds: number): Promise<void>;
}
