import {
    SignUpResource,
    SignUpStatus
} from '@tern-secure/types';
import { TernSecureBase } from './internal';

export class SignUp  extends TernSecureBase implements SignUpResource {
    status?: SignUpStatus | null = null;
    username?: string | null = null;
    firstName?: string | null = null;
    lastName?: string | null = null
    email: string | null = null;

  withSocialProvider(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}