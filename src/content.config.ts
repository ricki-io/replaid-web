import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string().default('Ricard P'),
    date: z.date(),
    category: z.string().default('Automation'),
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
