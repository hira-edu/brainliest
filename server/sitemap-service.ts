import { storage } from './storage';

export interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
}

export class SitemapService {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://brainliest.com') {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Generate complete sitemap with all URLs
   */
  async generateSitemap(): Promise<SitemapUrl[]> {
    const urls: SitemapUrl[] = [];
    const now = new Date().toISOString();

    // Static pages with high priority
    urls.push(
      {
        loc: `${this.baseUrl}/`,
        lastmod: now,
        changefreq: 'daily',
        priority: '1.0'
      },
      {
        loc: `${this.baseUrl}/subjects`,
        lastmod: now,
        changefreq: 'daily',
        priority: '0.9'
      },
      {
        loc: `${this.baseUrl}/categories`,
        lastmod: now,
        changefreq: 'weekly',
        priority: '0.8'
      }
    );

    // Legal and info pages
    urls.push(
      {
        loc: `${this.baseUrl}/terms`,
        lastmod: now,
        changefreq: 'monthly',
        priority: '0.3'
      },
      {
        loc: `${this.baseUrl}/privacy`,
        lastmod: now,
        changefreq: 'monthly',
        priority: '0.3'
      },
      {
        loc: `${this.baseUrl}/contact`,
        lastmod: now,
        changefreq: 'monthly',
        priority: '0.4'
      },
      {
        loc: `${this.baseUrl}/our-story`,
        lastmod: now,
        changefreq: 'monthly',
        priority: '0.4'
      }
    );

    // Category pages
    const categories = await this.getCategoryUrls();
    urls.push(...categories);

    // Subject pages
    const subjects = await this.getSubjectUrls();
    urls.push(...subjects);

    // Exam pages
    const exams = await this.getExamUrls();
    urls.push(...exams);

    return urls;
  }

  /**
   * Get category and subcategory URLs
   */
  private async getCategoryUrls(): Promise<SitemapUrl[]> {
    const urls: SitemapUrl[] = [];
    const now = new Date().toISOString();

    try {
      const categories = await storage.getCategories();
      const subcategories = await storage.getSubcategories();

      // Main category pages
      for (const category of categories) {
        urls.push({
          loc: `${this.baseUrl}/categories/${category.id}`,
          lastmod: now,
          changefreq: 'weekly',
          priority: '0.7'
        });
      }

      // Subcategory pages
      for (const subcategory of subcategories) {
        urls.push({
          loc: `${this.baseUrl}/categories/${subcategory.categoryId}/${subcategory.id}`,
          lastmod: now,
          changefreq: 'weekly',
          priority: '0.6'
        });
      }
    } catch (error) {
      console.error('Error generating category URLs:', error);
    }

    return urls;
  }

  /**
   * Get subject URLs (slug-based)
   */
  private async getSubjectUrls(): Promise<SitemapUrl[]> {
    const urls: SitemapUrl[] = [];

    try {
      const subjects = await storage.getSubjects();

      for (const subject of subjects) {
        const slug = subject.slug || this.generateSlug(subject.name);
        urls.push({
          loc: `${this.baseUrl}/subjects/${slug}`,
          lastmod: new Date().toISOString(),
          changefreq: 'weekly',
          priority: '0.8'
        });
      }
    } catch (error) {
      console.error('Error generating subject URLs:', error);
    }

    return urls;
  }

  /**
   * Get exam URLs (slug-based)
   */
  private async getExamUrls(): Promise<SitemapUrl[]> {
    const urls: SitemapUrl[] = [];

    try {
      const exams = await storage.getExams();

      for (const exam of exams) {
        const slug = exam.slug || this.generateSlug(exam.title);
        urls.push({
          loc: `${this.baseUrl}/exams/${slug}`,
          lastmod: new Date().toISOString(),
          changefreq: 'weekly',
          priority: '0.7'
        });

        // Exam practice URLs
        urls.push({
          loc: `${this.baseUrl}/exams/${slug}/practice`,
          lastmod: new Date().toISOString(),
          changefreq: 'daily',
          priority: '0.9'
        });
      }
    } catch (error) {
      console.error('Error generating exam URLs:', error);
    }

    return urls;
  }

  /**
   * Generate XML sitemap
   */
  async generateXmlSitemap(): Promise<string> {
    const urls = await this.generateSitemap();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const url of urls) {
      xml += '  <url>\n';
      xml += `    <loc>${this.escapeXml(url.loc)}</loc>\n`;
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    xml += '</urlset>';
    return xml;
  }

  /**
   * Generate robots.txt with sitemap reference
   */
  generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

# Sitemap
Sitemap: ${this.baseUrl}/sitemap.xml

# Disallow admin and private areas
Disallow: /admin
Disallow: /api/admin
Disallow: /*.json$
Disallow: /auth/
Disallow: /settings/

# Allow important directories
Allow: /subjects/
Allow: /exams/
Allow: /categories/
`;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Update sitemap cache when content changes
   */
  async invalidateSitemapCache(): Promise<void> {
    // This method can be called whenever subjects/exams are modified
    // to trigger sitemap regeneration
    console.log('Sitemap cache invalidated - will regenerate on next request');
  }
}

export const sitemapService = new SitemapService();