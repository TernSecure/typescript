import { TernSecureTenantManager } from "../utils/admin-init";
import type { SignInResponse } from '@tern-secure/types';


export async function createTenant(
  displayName: string,
  emailSignInConfig: {
    enabled: boolean;
    passwordRequired: boolean;
  },
  multiFactorConfig?: {
    state: 'ENABLED' | 'DISABLED';
    factorIds: "phone"[];
    testPhoneNumbers?: {
        [phoneNumber: string]: string;
    }
  }
) {
  try {
    const tenantConfig = {
      displayName,
      emailSignInConfig,
      ...(multiFactorConfig && { multiFactorConfig })
    };

    const tenant = await TernSecureTenantManager.createTenant(tenantConfig);
    
    return {
      success: true,
      tenantId: tenant.tenantId,
      displayName: tenant.displayName,
    };
  } catch (error) {
    console.error('Error creating tenant:', error);
    throw new Error('Failed to create tenant');
  }
}

export async function createTenantUser(
  email: string,
  password: string,
  tenantId: string
): Promise<SignInResponse> {
  try {
    const tenantAuth = TernSecureTenantManager.authForTenant(tenantId);
    
    const userRecord = await tenantAuth.createUser({
      email,
      password,
      emailVerified: false,
      disabled: false
    });

    return {
      success: true,
      message: 'Tenant user created successfully',
      user: userRecord.uid,
    };
  } catch (error) {
    console.error('Error creating tenant user:', error);
    throw new Error('Failed to create tenant user');
  }
}
