---
title: "Connect Your Customer Messages to Your AI Agent"
description: "Connect WhatsApp, the Replaid widget, Instagram, Messenger, or Telegram so your agent can read customer messages and help with replies."
date: 2025-10-20
updatedDate: 2026-09-14
category: "Automation"
author: "Ricard P"
---

A question can arrive through your website while another customer is waiting in Instagram DMs. Giving an agent useful access to those conversations should not require a separate workflow for every channel.

Replaid connects supported channels and makes their conversations available to your agent through MCP or REST. Your agent can read context, prepare replies, and request permitted actions. The customer continues to use the channel where they contacted you.

This article reflects [Replaid's current role as the connection for your agent](/replaid-connects-your-ai-agent-to-your-customers/).

## Choose the channel you need first

These are the current connections:

| Channel | What you connect | Supported conversations |
| --- | --- | --- |
| WhatsApp | Your WhatsApp Business number | Customer messages and text replies |
| Replaid widget | Your website widget | Text messages and replies |
| Instagram | A Business or Creator account | Text DMs and text comments |
| Messenger | A Facebook Page | Text messages and replies |
| Telegram | A Telegram bot | Private text messages to the bot and replies |

Each team can connect one Instagram account, one Facebook Page, one Telegram bot, and one Replaid widget. Telegram personal accounts and groups are not supported. Instagram, Messenger, Telegram, and the Replaid widget support text only; attachments are not supported on these four channels. TikTok is not available yet.

Start with the channel where you can review a few real conversations. You can add the others when the first workflow is useful.

## Bring in the available context

For Instagram and Messenger, you can choose to import available text messages from the last 30 days. Instagram history imports cover DMs only. The platforms may not provide every message, so an import is not a complete archive.

Imports do not send replies or trigger notifications. Review the imported context before asking your agent to act on it, and do not assume that an older conversation has a current unanswered request.

After connection, ask your agent to read the available conversation before drafting. Give it the business information it needs through your own agent setup. Connecting a channel does not supply your prices, opening hours, or support policies.

## Use the same review process across channels

A practical first request is:

> Read the latest unanswered conversation in Replaid. Summarize the customer's question and save a draft based on the information I have given you. Ask me if information is missing. Do not send the reply.

Check the draft in Replaid. Confirm that it answers the actual question and fits the conversation. Once you permit sending, test one response and check the outcome on the original channel.

A common interface does not remove platform rules. The available actions can depend on the channel and the conversation state. Your agent should check action results rather than treating every request as a delivered reply.

## Keep the agent's role clear

Your agent provides the knowledge and decides what to request from the tools. Replaid provides the connected conversation context and applies controls to those action requests.

You can begin by asking the agent to work on messages yourself. Connecting through MCP does not automatically start replies when messages arrive. Unattended processing needs an external schedule or webhook receiver that starts your agent.

If you later add another channel, review its requirements and test the same read, draft, and send steps. You keep a familiar agent workflow while checking the limits of each new connection.

## Connect one channel today

[Get started with Replaid](/get-started/) and follow the [connection guide](/docs/connect-your-agent/) for the current setup steps. Keep the first task narrow: read one conversation, save one draft, and review it before sending.
