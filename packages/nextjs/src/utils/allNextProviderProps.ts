import type { TernSecureNextProps } from "../types";
import type { 
  TernSecureProviderProps, 
  IsomorphicTernSecureOptions 
} from "@tern-secure/react";

// Helper type for the return value, as children are handled by the consuming component
type NextProviderProcessedProps = Omit<TernSecureProviderProps, 'children'>;

export const allNextProviderPropsWithEnv = (
  nextProps: Omit<TernSecureNextProps, 'children'>
): NextProviderProcessedProps => {
  const {
    loginPath,
    signUpPath,
    apiKey: propsApiKey,
    projectId: propsProjectId,
    customDomain: propsCustomDomain,
    proxyUrl: propsProxyUrl,
    environment: propsEnvironment,
    requiresVerification: propsRequiresVerification,
    loadingComponent: propsLoadingComponent,
    ...baseProps 
  } = nextProps;

  const envConfig = {
    apiKey: process.env.NEXT_PUBLIC_TERN_API_KEY,
    projectId: process.env.NEXT_PUBLIC_TERN_PROJECT_ID,
    customDomain: process.env.NEXT_PUBLIC_TERN_CUSTOM_DOMAIN,
    proxyUrl: process.env.NEXT_PUBLIC_TERN_PROXY_URL,
    environment: process.env.NEXT_PUBLIC_TERN_ENVIRONMENT, // Added environment
  };

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    appName: process.env.NEXT_PUBLIC_FIREBASE_APP_NAME || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENTID
  };

  // Merge config values: props take precedence over environment variables
  const finalApiKey = propsApiKey ?? envConfig.apiKey;
  const finalProjectId = propsProjectId ?? envConfig.projectId;
  const finalCustomDomain = propsCustomDomain ?? envConfig.customDomain;
  const finalProxyUrl = propsProxyUrl ?? envConfig.proxyUrl;
  const finalEnvironment = propsEnvironment ?? envConfig.environment;

  // Construct the result, ensuring it conforms to NextProviderProcessedProps
  // (Omit<TernSecureProviderProps, 'children'>)
  const result: NextProviderProcessedProps = {
    ...(baseProps as Omit<TernSecureProviderProps, 'children' | keyof IsomorphicTernSecureOptions | 'requiresVerification' | 'loadingComponent'>),
    
    // Set the merged/prioritized instance configuration properties
    apiKey: finalApiKey,
    projectId: finalProjectId,
    customDomain: finalCustomDomain,
    proxyUrl: finalProxyUrl,
    environment: finalEnvironment,

    // Set the Firebase configuration properties
    firebaseConfig,
    
    // Set properties explicitly taken from TernSecureNextProps (props version)
    // These are part of the TernSecureProviderProps interface.
    requiresVerification: propsRequiresVerification,
    loadingComponent: propsLoadingComponent,
    ...(propsRequiresVerification !== undefined && { requireverification: propsRequiresVerification }),

    //TernSecure: baseProps.Instance,
    initialState: baseProps.initialState,
    bypassApiKey: baseProps.bypassApiKey,
    onUserChanged: baseProps.onUserChanged,
    initialSession: baseProps.initialSession,
    defaultAppearance: baseProps.defaultAppearance,
    platform: baseProps.platform,
    mode: baseProps.mode,
    onAuthStateChanged: baseProps.onAuthStateChanged,
    onError: baseProps.onError,
  };

  // Clean up undefined keys that might have resulted from spreading if not present in baseProps
  // and also not set by merged values (e.g. if env var is also undefined)
  Object.keys(result).forEach(key => {
    if (result[key as keyof NextProviderProcessedProps] === undefined) {
      delete result[key as keyof NextProviderProcessedProps];
    }
  });

  return result;
};