// Utility functions for sitemap management

/**
 * Submit sitemap to search engines
 * Call this function after content updates to notify search engines
 */
export async function submitSitemapToSearchEngines(siteUrl: string) {
  const sitemapUrl = `${siteUrl}/sitemap.xml`;

  const searchEngines = [
    {
      name: 'Google',
      url: `https://www.google.com/ping?sitemap=${encodeURIComponent(
        sitemapUrl
      )}`,
    },
    {
      name: 'Bing',
      url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(
        sitemapUrl
      )}`,
    },
  ];

  const results = [];

  for (const engine of searchEngines) {
    try {
      const response = await fetch(engine.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Workflow Automation Strategies Sitemap Submitter',
        },
      });

      results.push({
        engine: engine.name,
        success: response.ok,
        status: response.status,
      });

      console.log(`✅ Sitemap submitted to ${engine.name}: ${response.status}`);
    } catch (error) {
      results.push({
        engine: engine.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      console.error(`❌ Failed to submit sitemap to ${engine.name}:`, error);
    }
  }

  return results;
}

/**
 * Get sitemap statistics
 */
export async function getSitemapStats(siteUrl: string) {
  try {
    const response = await fetch(`${siteUrl}/sitemap.xml`);
    const xmlText = await response.text();

    // Count URLs in sitemap
    const urlMatches = xmlText.match(/<url>/g);
    const urlCount = urlMatches ? urlMatches.length : 0;

    // Extract last modification dates
    const lastmodMatches = xmlText.match(/<lastmod>(.*?)<\/lastmod>/g);
    const dates =
      lastmodMatches?.map((match) => {
        const date = match.replace(/<\/?lastmod>/g, '');
        return new Date(date);
      }) || [];

    const latestUpdate =
      dates.length > 0
        ? new Date(Math.max(...dates.map((d) => d.getTime())))
        : new Date();

    return {
      totalUrls: urlCount,
      lastUpdate: latestUpdate.toISOString(),
      isValid: response.ok,
      size: xmlText.length,
    };
  } catch (error) {
    console.error('Error getting sitemap stats:', error);
    return null;
  }
}

/**
 * Validate sitemap format
 */
export function validateSitemapEntry(
  url: string,
  lastmod: string,
  changefreq: string,
  priority: number
) {
  const errors = [];

  // Validate URL
  try {
    new URL(url);
  } catch {
    errors.push('Invalid URL format');
  }

  // Validate lastmod date
  if (lastmod && isNaN(Date.parse(lastmod))) {
    errors.push('Invalid lastmod date format');
  }

  // Validate changefreq
  const validChangefreq = [
    'always',
    'hourly',
    'daily',
    'weekly',
    'monthly',
    'yearly',
    'never',
  ];
  if (changefreq && !validChangefreq.includes(changefreq)) {
    errors.push('Invalid changefreq value');
  }

  // Validate priority
  if (priority < 0 || priority > 1) {
    errors.push('Priority must be between 0.0 and 1.0');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
