export interface CookieStore {
  get(name: string): Promise<{ value: string | undefined }>;
  set(name: string, value: string, options: CookieOptions): Promise<void>;
  delete(name: string): Promise<void>;
}

export interface CookieOptions {
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
}