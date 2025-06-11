{/*import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence, browserLocalPersistence} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeConfig} from './config';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME;

// Initialize immediately
const config = initializeConfig();
const clientApp = getApps().length === 0 ? initializeApp(config, APP_NAME) : getApps()[0];
export const ternSecureAuth = getAuth(clientApp);
setPersistence(ternSecureAuth, browserLocalPersistence); //to change later user should be able to choose persistance
const firestore = getFirestore(clientApp);
const storage = getStorage(clientApp);



export const TernSecureAuth = () => ternSecureAuth;
export const TernSecureFirestore = () => firestore;
export const TernSecureStorage = () => storage;
*/}