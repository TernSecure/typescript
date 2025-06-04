/**
 * Firebase implementation of the TernSecureAuthProvider interface
 */
export class TernSecureAuthProvider  {
    private static instance: TernSecureAuthProvider | null;

    public static getOrCreateInstance(): TernSecureAuthProvider {
        if (!TernSecureAuthProvider.instance) {
            TernSecureAuthProvider.instance = new TernSecureAuthProvider();
        }
        return TernSecureAuthProvider.instance;
    }

    static clearInstance() {
        TernSecureAuthProvider.instance = null;
    }

}