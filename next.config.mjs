import { withPayload } from '@payloadcms/next/withPayload';
import { fileURLToPath } from 'node:url';
export default withPayload({
  output: 'standalone', poweredByHeader: false,
  turbopack: { root: fileURLToPath(new URL('.', import.meta.url)) },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
    ] }];
  },
});
