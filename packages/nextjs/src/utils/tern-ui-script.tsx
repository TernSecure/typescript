import NextScript from 'next/script'
import { ternUIgetScriptUrl } from '@tern-secure/react'
import type { TernSecureNextProps } from '../types'

const isDevelopment = process.env.NODE_ENV === 'development';
const localPort = process.env.TERN_UI_PORT || '4000';

type TernUIScriptProps = Pick<TernSecureNextProps, 'customDomain' | 'proxyUrl'> & {
    version?: string;
    nonce?: string;
}

const devDomain = isDevelopment 
    ? `http://localhost:${localPort || process.env.NEXT_PUBLIC_TERN_UI_PORT || '4000'}`
    : undefined


export function TernUIScript({
    customDomain,
    proxyUrl,
    version,
    nonce,
}: TernUIScriptProps) {
    const effectiveDomain = isDevelopment ? devDomain : customDomain
    console.log('[TernSecure] TernUIScript: Using effective domain:', effectiveDomain);

    if (!effectiveDomain) {
        console.warn('[TernSecure] TernUIScript: No custom domain or proxy URL provided. The script will not be loaded.');
        return null;
    }

    const scriptUrl = ternUIgetScriptUrl({
        customDomain: effectiveDomain,
        proxyUrl,
        version,
        nonce,
    });

    return (
        <NextScript
          src={scriptUrl}
          nonce={nonce}
          strategy={undefined}
          //crossOrigin= {undefined}
        />
    )
}