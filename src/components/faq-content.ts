import { productCopy } from './product-copy';

export const faqs = [
  { q: 'Does Replaid include an AI agent?', a: 'You bring your own agent. It provides the reasoning, business knowledge, and reply instructions. Replaid connects the channels, supplies conversation context, applies action policies, and records the results.' },
  { q: 'Which channels can I connect?', a: `${productCopy.channels} ${productCopy.channelLimits} ${productCopy.futureChannels}` },
  { q: 'Can I import past conversations?', a: productCopy.history },
  { q: 'Can I try it without sending replies?', a: 'Yes. Keep sending disabled and allow draft replies. Your agent can read a conversation and save a draft in Replaid without sending it to the customer.' },
  { q: 'Does connecting MCP turn on automatic replies?', a: `No. ${productCopy.automation}` },
  { q: 'Can a person take over?', a: 'Yes. Your agent can flag a conversation for a person and pause its automation. You can review the conversation and the handoff in Replaid, then resume automation when appropriate.' },
  { q: 'Do I need to write code?', a: 'A compatible MCP client can connect through its settings and Replaid authorization. Custom REST integrations and webhook receivers require technical setup. Client support and account requirements vary.' },
  { q: 'What does Replaid cost?', a: productCopy.pricing },
];
