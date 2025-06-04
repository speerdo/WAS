import type { APIRoute } from 'astro';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';

// Site configuration
const SITE_URL = 'https://workflowautomationstrategies.com'; // Update with your actual domain
const PAGES_DIR = join(process.cwd(), 'src/pages');
const CONTENT_DIR = join(process.cwd(), 'src/content/blog');

interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  priority: number;
}

// Get all static pages
async function getStaticPages(): Promise<SitemapEntry[]> {
  const pages: SitemapEntry[] = [];

  // Define static pages with their priorities and change frequencies
  const staticPages = [
    { path: '/', priority: 1.0, changefreq: 'weekly' as const },
    { path: '/about', priority: 0.8, changefreq: 'monthly' as const },
    { path: '/services', priority: 0.9, changefreq: 'monthly' as const },
    { path: '/case-studies', priority: 0.8, changefreq: 'weekly' as const },
    { path: '/blog', priority: 0.9, changefreq: 'daily' as const },
    { path: '/pricing', priority: 0.8, changefreq: 'monthly' as const },
    { path: '/faq', priority: 0.7, changefreq: 'monthly' as const },
    { path: '/contact', priority: 0.8, changefreq: 'monthly' as const },
  ];

  // Get current date for lastmod
  const currentDate = new Date().toISOString().split('T')[0];

  for (const page of staticPages) {
    // Check if the page file exists
    const possiblePaths = [
      join(
        PAGES_DIR,
        `${page.path === '/' ? 'index' : page.path.slice(1)}.astro`
      ),
      join(PAGES_DIR, page.path.slice(1), 'index.astro'),
    ];

    let pageExists = false;
    let lastModified = currentDate;

    for (const filePath of possiblePaths) {
      try {
        const stats = await stat(filePath);
        pageExists = true;
        lastModified = stats.mtime.toISOString().split('T')[0];
        break;
      } catch {
        // File doesn't exist, continue checking
      }
    }

    if (pageExists) {
      pages.push({
        url: `${SITE_URL}${page.path}`,
        lastmod: lastModified,
        changefreq: page.changefreq,
        priority: page.priority,
      });
    }
  }

  return pages;
}

// Get all blog posts
async function getBlogPosts(): Promise<SitemapEntry[]> {
  const posts: SitemapEntry[] = [];

  try {
    const files = await readdir(CONTENT_DIR);
    const markdownFiles = files.filter((file) => file.endsWith('.md'));

    for (const file of markdownFiles) {
      try {
        const filePath = join(CONTENT_DIR, file);
        const fileContent = await readFile(filePath, 'utf-8');
        const { data: frontmatter } = matter(fileContent);
        const stats = await stat(filePath);

        const slug = file.replace('.md', '');
        const publishDate = frontmatter.publishDate
          ? new Date(frontmatter.publishDate)
          : stats.mtime;
        const lastModified =
          stats.mtime > publishDate ? stats.mtime : publishDate;

        posts.push({
          url: `${SITE_URL}/blog/${slug}`,
          lastmod: lastModified.toISOString().split('T')[0],
          changefreq: 'monthly',
          priority: 0.7,
        });
      } catch (error) {
        console.warn(`Error processing blog post ${file}:`, error);
      }
    }

    // Sort by date (newest first) for better crawling
    posts.sort(
      (a, b) => new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime()
    );
  } catch (error) {
    console.warn('Error reading blog directory:', error);
  }

  return posts;
}

// Generate XML sitemap
function generateSitemapXML(entries: SitemapEntry[]): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${entries
  .map(
    (entry) => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return xml;
}

export const GET: APIRoute = async () => {
  try {
    // Get all pages and blog posts
    const [staticPages, blogPosts] = await Promise.all([
      getStaticPages(),
      getBlogPosts(),
    ]);

    // Combine all entries
    const allEntries = [...staticPages, ...blogPosts];

    // Generate XML
    const sitemapXML = generateSitemapXML(allEntries);

    return new Response(sitemapXML, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', {
      status: 500,
    });
  }
};
