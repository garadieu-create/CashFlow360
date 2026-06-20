import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/docs',
          '/integrations',
          '/runway',
          '/treasury',
          '/flow',
          '/send',
          '/payroll',
          '/governance',
          '/marketplace',
          '/swarm',
          '/alerts',
        ],
        disallow: [
          '/modals',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://cashflow360.finance/sitemap.xml',
  };
}
