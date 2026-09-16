import { productCopy, betaAccess } from './product-copy';

export const faqs = [
  { q: 'How do I get beta access?', a: betaAccess.description },
  { q: 'Does Replaid include an AI agent?', a: 'No. Use ChatGPT, Claude, or Hermes Agent with the knowledge and instructions you provide. Replaid gives it access to messages, checks your permissions, and records each action.' },
  { q: 'Which channels can I connect?', a: `${productCopy.availableChannels} ${productCopy.futureChannels}` },
  { q: 'What do I need to connect a channel?', a: productCopy.channelRequirements },
  { q: 'Are there account or message limits?', a: productCopy.channelLimits },
  { q: 'Can I import past conversations?', a: productCopy.history },
  { q: 'Can I try it without sending replies?', a: 'Yes. Keep sending disabled and allow draft replies. Your agent can read a conversation and save a draft in Replaid without sending it to the customer.' },
  { q: 'Does connecting MCP turn on automatic replies?', a: `No. ${productCopy.automation}` },
  { q: 'Can a person take over?', a: 'Yes. Your agent can flag a conversation for a person and pause its automation. You can review the conversation and the handoff in Replaid, then resume automation when appropriate.' },
  { q: 'Do I need to write code?', a: 'You can connect a compatible agent through its settings and sign in to Replaid. Custom API connections and automatic triggers need technical setup. Requirements vary by client and plan.' },
  { q: 'What does Replaid cost?', a: productCopy.pricing },
];
