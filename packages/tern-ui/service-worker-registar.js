import { initializeApp } from "firebase/app";
import { getAuth, getIdToken } from "firebase/auth";
import { getInstallations, getToken } from "firebase/installations";

let firebaseConfig;

const getAuthIdToken = async (auth) => {
    try {
        await auth.authStateReady();
        if (!auth.currentUser) return;
        return await getIdToken(auth.currentUser, true);
    } catch (error) {
        console.error('Failed to get auth ID token:', error);
        return null;
    }
}

const fetchWithFirebaseHeaders = async (request) => {
    try {
        const app = initializeApp(firebaseConfig)
        const auth = getAuth(app);
        const installations = getInstallations(app);
        const headers = new Headers(request.headers);

        const [authIdToken, installationToken] = await Promise.all([
            getAuthIdToken(auth),
            getToken(installations)
        ]);

        headers.append("TernSecure-Instance-ID-Token", installationToken);
        if (authIdToken) headers.append("Authorization", `Bearer ${authIdToken}`);
        
        const newRequest = new Request(request, { headers });
        return await fetch(newRequest);
    } catch (error) {
        console.error('Error in fetchWithFirebaseHeaders:', error);
        return await fetch(request);
    }
}

self.addEventListener('install', (event) => {
    const serializedFirebaseConfig = new URL(location).searchParams.get('firebaseConfig');
    if (!serializedFirebaseConfig) {
        throw new Error('Firebase config object not found in service worker query string.');
    }

    firebaseConfig  = JSON.parse(serializedFirebaseConfig);
    console.log('Firebase config loaded in service worker:', firebaseConfig);
});

self.addEventListener('fetch', (event) => {
    const { origin } = new URL(event.request.url);
    if (origin !== self.location.origin) return;
    event.respondWith(fetchWithFirebaseHeaders(event.request));
});

const getOriginFromUrl = (url) => {
  // https://stackoverflow.com/questions/1420881/how-to-extract-base-url-from-a-string-in-javascript
  const pathArray = url.split('/');
  const protocol = pathArray[0];
  const host = pathArray[2];
  return protocol + '//' + host;
};

// Get underlying body if available. Works for text and json bodies.
const getBodyContent = (req) => {
  return Promise.resolve().then(() => {
    if (req.method !== 'GET') {
      if (req.headers.get('Content-Type').indexOf('json') !== -1) {
        return req.json()
          .then((json) => {
            return JSON.stringify(json);
          });
      } else {
        return req.text();
      }
    }
  }).catch((error) => {
    // Ignore error.
  });
};

self.addEventListener('fetch', (event) => {
  /** @type {FetchEvent} */
  const evt = event;

  const requestProcessor = (idToken) => {
    let req = evt.request;
    let processRequestPromise = Promise.resolve();
    // For same origin https requests, append idToken to header.
    if (self.location.origin == getOriginFromUrl(evt.request.url) &&
        (self.location.protocol == 'https:' ||
         self.location.hostname == 'localhost') &&
        idToken) {
      // Clone headers as request headers are immutable.
      const headers = new Headers();
      req.headers.forEach((val, key) => {
        headers.append(key, val);
      });
      // Add ID token to header.
      headers.append('Authorization', 'Bearer ' + idToken);
      processRequestPromise = getBodyContent(req).then((body) => {
        try {
          req = new Request(req.url, {
            method: req.method,
            headers: headers,
            mode: 'same-origin',
            credentials: req.credentials,
            cache: req.cache,
            redirect: req.redirect,
            referrer: req.referrer,
            body,
            // bodyUsed: req.bodyUsed,
            // context: req.context
          });
        } catch (e) {
          // This will fail for CORS requests. We just continue with the
          // fetch caching logic below and do not pass the ID token.
        }
      });
    }
    return processRequestPromise.then(() => {
      return fetch(req);
    });
  };
  // Fetch the resource after checking for the ID token.
  // This can also be integrated with existing logic to serve cached files
  // in offline mode.
  evt.respondWith(getIdTokenPromise().then(requestProcessor, requestProcessor));
});