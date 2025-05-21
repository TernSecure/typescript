import type { 
    TernSecureInstanceTree
} from "@tern-secure/types";
import { 
    useAssertWrappedByTernSecureProvider, 
    useTernSecureInstanceContext 
} from "../ternsecureProvider";

export const useTernSecure = (): TernSecureInstanceTree => {
    /**
     * if no assertion is needed, you can use the following:
     *  const instance  = useTernSecureInstanceContext();
     *  if (!instance) {
     *      throw new Error('useTernSecure must be used within a TernSecureProvider');
     *  }
     *  return instance;
     */
    
    useAssertWrappedByTernSecureProvider('useTernSecure');
    return useTernSecureInstanceContext();
}