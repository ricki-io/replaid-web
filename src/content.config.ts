import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().optional(),
    description: z.string(),
    author: z.string().default('Ricard Pons'),
    authorUrl: z.string().url().startsWith('https://').optional(),
    date: z.date(),
    updatedDate: z.date().optional(),
    featured: z.boolean().default(false),
    historical: z.boolean().default(false),
    supersededBy: reference('blog').optional(),
    relatedPosts: z.array(reference('blog')).max(2).default([]),
    category: z.string().default('Automation'),
    image: z.string().optional(),
    socialImage: z.object({
      src: z.string().regex(/^\/og-[a-z0-9-]+\.png$/),
      alt: z.string().min(1),
    }).optional(),
    draft: z.boolean().default(false),
  }).refine(data => !data.updatedDate || data.updatedDate >= data.date, {
    message: 'The update date must not precede publication.',
    path: ['updatedDate'],
  }).refine(data => !data.historical || (data.supersededBy && !data.featured), {
    message: 'Historical articles must link to a current article and cannot be featured.',
    path: ['historical'],
  }),
});

export const collections = { blog };
