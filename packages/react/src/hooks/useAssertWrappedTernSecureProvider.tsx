import {
    useAssertWrappedByTernSecureProvider as useAssertWrappedByTernSecureProviderBase,
} from '@tern-secure/shared/react'

export const useAssertWrappedByTernSecureProvider = (source: string): void => {
    useAssertWrappedByTernSecureProviderBase(() => {
        throw new Error(
            `${source} can only be used within the <TernSecureProvider /> component.
Possible fixes:
1. Ensure that the <TernSecureProvider /> is correctly wrapping your application
2. Check for multiple versions of @tern-secure packages in your project`
        );
    }
    );
}