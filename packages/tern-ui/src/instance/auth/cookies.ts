  import { cookieHandler, serverCookieHandler } from '@tern-secure/shared/cookie'
  import { CookieStore } from '@tern-secure/types';

  export type csrfSessionCookieProps = {
    set: (token: string) => void;
    get: () => void;
    remove: () => void;
  }
  const CSRF_SESSION_COOKIE_NAME=  '__session_terncf'

  //private generateCSRFToken(): string {
  //  const array = new Uint8Array(32);
  //  crypto.getRandomValues(array);
  //  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  //}

  function generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }


  export const createCSRFCookie = (): csrfSessionCookieProps => {
    const csrfSessionCookie = cookieHandler(CSRF_SESSION_COOKIE_NAME)

    const set = (token: string) => {
      const expires = 1 / 24; //1 hour
      const sameSite = 'none';
      const secure = true
      const cookieOptions = { expires, sameSite, secure};
      csrfSessionCookie.set(token, cookieOptions);
    };

    const remove = () => {
      csrfSessionCookie.remove()
    };

    const get = () => {
      const token = csrfSessionCookie.get()

      if (!token || isExpired()) {
        return refresh();
      }
      return token;
    };

    const isExpired = () => {
      const timestamp = csrfSessionCookie.get();
      if (!timestamp) return true;

      const tokenAge = Date.now() - parseInt(timestamp, 10);
      const oneHour = 60 * 60 * 1000; // 1 hour
      return tokenAge > oneHour;
    }

    const refresh = () => {
      const newToken = generateCSRFToken();
      set(newToken);
      return newToken;
    }

    return {
      set,
      get,
      remove
    }
  }



export const createServerCookie = (response: Response): CookieStore => {
  const serverCookie = serverCookieHandler(response);

  const set = async (name: string, value: string) => {
    await serverCookie.set(name, value, {
      maxAge: 3600, // 1 hour in seconds
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });
  };

  const get = async (name: string) => {
    return await serverCookie.get(name);
  };

  const remove = async (name: string) => {
    await serverCookie.delete(name);
  };

  return {
    set,
    get,
    delete: remove
  };
};