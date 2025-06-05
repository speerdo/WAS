import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    category: z.enum([
      'How-to Guides',
      'Tool Comparisons',
      'Industry Insights',
      'Marketing Automation',
      'Best Practices',
    ]),
    publishDate: z.coerce.date(),
    readTime: z.string(),
    featured: z.boolean().default(false),
    image: z.string(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }),
});

export const collections = {
  blog,
};
