---
title: "3 Customer Message Workflows for Your AI Agent"
description: "Start with lead qualification, support triage, and inbox priorities. Use clear instructions, limited permissions, and draft review for each workflow."
author: "Ricard P"
date: 2025-10-22
updatedDate: 2026-09-14
category: "Automation"
---

A useful first workflow has a clear input, a small set of permitted actions, and a result you can check. Customer messages are a good place to start because you can review what the agent read and what it proposed to do.

With Replaid, your own agent reads conversations from connected channels and requests actions through MCP or REST. You provide the business knowledge and instructions. Replaid checks the requested actions against your policies.

This guide has been updated for [the current Replaid product](/replaid-connects-your-ai-agent-to-your-customers). The examples below are suggested workflows, not results from customer deployments.

## 1. Check whether an enquiry fits your business

**Input:** a conversation from a potential customer.

Give your agent the criteria for a relevant enquiry. For example, a service business may need to know the type of work, the location, and the requested timing before deciding on the next step.

Ask the agent to read the conversation, list what is known, and identify what is missing. It can save a draft that asks for the next useful detail. With the required permissions, it can also record a lead qualification decision and a reason in Replaid.

Start with this instruction:

> Read this conversation and compare the request with my lead criteria. Explain which criteria are met and which facts are missing. Save a draft asking for one missing detail. Do not send it or make a qualification decision yet.

**Check:** does the draft ask for useful information without guessing at budget, intent, or personal details? Permit qualification actions only after the agent applies your criteria consistently.

## 2. Prepare a support answer or hand the case to a person

**Input:** a customer asking for help.

Give your agent your support instructions and the reference material it may use. It can read the available context, prepare an answer, and flag information it cannot verify.

Define the cases that need human attention. A complaint, an exception to your refund policy, or a request that depends on missing account information may need review rather than a confident reply.

Try:

> Read this support conversation. Use my support instructions to draft an answer. If the answer needs information I have not provided, explain what is missing. Do not promise a refund or send a reply.

Where allowed, your agent can request an escalation in Replaid. This marks the conversation for human attention and pauses automated replies. Decide who will handle those cases and how they will know to check them; escalation alone does not resolve the customer's problem.

**Check:** does the agent use the approved information and hand over uncertain cases with a useful summary?

## 3. Find the conversations that need attention

**Input:** a set of open conversations.

Ask your agent to review the available conversations and explain which ones need a response. Your instructions might prioritize a customer waiting for clarification or a support case that needs a person.

Use a read-only request first:

> Review my open conversations in Replaid. List the ones that need my attention, with a short reason and a suggested next step. Do not reply, archive, assign, or change tags.

Once that list is useful, you can permit specific actions such as tagging or assigning conversations. Keep the criteria explicit. An agent should not archive a difficult question just to make the inbox look clear.

**Check:** is each priority supported by something in the conversation? Review the items it did not select as well as the ones it did.

## Decide how each workflow starts

An MCP connection makes Replaid tools available when your agent runs. It does not run these workflows by itself.

You can start them with a prompt. For unattended processing, use an external schedule or a webhook receiver that starts your agent. Configure that runner to check action results and avoid sending the same reply again after a retry.

Begin with one workflow and one channel. Review drafts and action outcomes before expanding the scope. Count the drafts you edit, incorrect decisions, and cases that need a person. Those checks are more useful than assuming that automation will improve sales.

[Explore Replaid](/get-started), then follow the [connection guide](/docs/connect-your-agent) to connect your agent and test its first draft.
