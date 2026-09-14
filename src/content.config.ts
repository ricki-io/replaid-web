import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string().default('Ricard P'),
    date: z.date(),
    updatedDate: z.date().optional(),
    featured: z.boolean().default(false),
    historical: z.boolean().default(false),
    supersededBy: reference('blog').optional(),
    category: z.string().default('Automation'),
    image: z.string().optional(),
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
