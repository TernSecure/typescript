import Cookies from 'js-cookie';

type removeCookieParams = {
    path?: string;
    domain?: string;
}

export function cookieHandler(cookieNanme: string) {
    return {
        set(value: string, options: Cookies.CookieAttributes = {}): void {
            Cookies.set(cookieNanme, value, options);
        },
        get() {
            return Cookies.get(cookieNanme);
        },
        remove(removeCookieParams?: removeCookieParams) {
            Cookies.remove(cookieNanme, removeCookieParams)
        }
    }
}