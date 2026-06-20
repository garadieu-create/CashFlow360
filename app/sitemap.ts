import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://cashflow360.finance';
  const routes = [
    { url: '', priority: 1.0, changeFrequency: 'daily' as const },
    { url: '/docs', priority: 0.9, changeFrequency: 'weekly' as const },
    { url: '/integrations', priority: 0.9, changeFrequency: 'weekly' as const },
    { url: '/runway', priority: 0.8, changeFrequency: 'daily' as const },
    { url: '/treasury', priority: 0.8, changeFrequency: 'daily' as const },
    { url: '/flow', priority: 0.8, changeFrequency: 'daily' as const },
    { url: '/send', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/payroll', priority: 0.8, changeFrequency: 'daily' as const },
    { url: '/governance', priority: 0.7, changeFrequency: 'weekly' as const },
    { url: '/marketplace', priority: 0.8, changeFrequency: 'daily' as const },
    { url: '/swarm', priority: 0.7, changeFrequency: 'daily' as const },
    { url: '/alerts', priority: 0.6, changeFrequency: 'weekly' as const },
  ];

  return routes.map(route => ({
    url: `${baseUrl}${route.url}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
