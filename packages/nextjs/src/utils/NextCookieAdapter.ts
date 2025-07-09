import { cookies } from 'next/headers';
import { CookieStore, CookieOptions } from '@tern-secure/types';

export class NextCookieStore implements CookieStore {
  async get(name: string): Promise<{ value: string | undefined }> {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(name);
    return { value: cookie?.value };
  }

  async set(name: string, value: string, options: CookieOptions): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(name, value, options);
  }

  async delete(name: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(name);
  }
}