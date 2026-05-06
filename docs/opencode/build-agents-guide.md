# How To Build Agents In OpenCode

## Why agents matter

OpenCode agents let you create focused assistants for repeatable jobs.

Instead of using one general assistant for everything, you can create agents with:

- a specific role
- a constrained toolset
- a custom prompt
- the right tone for the job

For Mentiohunt, this is useful because different work needs different behavior. A copywriting agent should sound founder-to-founder. A research agent should stay read-only. A code review agent should look for risks instead of making changes.

## Core concepts

OpenCode supports two agent types:

- `primary`: the main agent you interact with directly
- `subagent`: a specialized agent that can be invoked by a primary agent or with `@agent-name`

Built-in examples:

- `build`: full-access primary agent for implementation work
- `plan`: restricted primary agent for analysis and planning
- `general`: subagent for multi-step work
- `explore`: read-only subagent for searching and understanding code

For most custom Mentiohunt workflows, start with a `subagent`.

## Where to define agents

You can define agents in two ways:

1. `opencode.json`
2. Markdown files in `.opencode/agents/`

For this repo, markdown files are the simpler option because they keep each agent self-contained.

Project-level agents live here:

```text
.opencode/agents/
```

Example:

```text
.opencode/agents/copywriter.md
```

The filename becomes the agent name.

## Recommended process

### 1. Start from the job, not the prompt

Before writing anything, define:

- what the agent should do
- when it should be used
- what it must avoid
- which tools it actually needs

Good prompt writing starts with sharp scope.

Example:

- Bad: "Helps with marketing"
- Better: "Writes and refines founder-to-founder landing page and product copy for Mentiohunt"

### 2. Pick the smallest mode that works

Use `subagent` unless you have a real reason to create a new primary workflow.

Why:

- easier to invoke with `@name`
- easier to keep specialized
- lower risk of overlapping with the default build flow

### 3. Keep permissions tight

Permissions are one of the most important parts of agent design.

A good agent should only have the tools it needs.

Examples:

- copy agent: allow `read`, `glob`, `grep`, `edit`; deny `bash`
- research agent: allow `read`, `glob`, `grep`, maybe `webfetch`; deny `edit`
- code reviewer: allow `read`, `glob`, `grep`; deny `edit` and maybe `bash`

This reduces bad behavior and makes the agent more predictable.

### 4. Write the prompt around real product context

Generic prompts produce generic results.

Agent prompts should include:

- product context
- audience
- pain points
- writing or review principles
- explicit avoid rules
- repo-specific expectations

For Mentiohunt, that means grounding agents in terms like:

- daily queue
- opportunities
- fit
- outreach angle
- explainable rationale
- self-serve backlink prospecting

### 5. Tell the agent what success looks like

The more concrete the success criteria, the better the outputs.

Examples:

- "Write copy that sounds like a founder talking to another founder"
- "Do not imply guaranteed backlinks"
- "Do not claim the product posts on the user's behalf"
- "Prioritize clear next steps over generic SEO language"

## Anatomy of a markdown agent

An OpenCode markdown agent has two parts:

1. Frontmatter
2. Prompt body

Example:

```md
---
description: Writes and refines Mentiohunt copy for founders and small agencies
mode: subagent
temperature: 0.7
color: accent
permission:
  read: allow
  glob: allow
  grep: allow
  edit: allow
  bash: deny
  webfetch: deny
  task: deny
---

You are Mentiohunt's copywriting agent.

Write like a smart founder talking to another founder.
Keep the tone conversational, grounded, and direct.
Do not imply the product posts on the user's behalf.
```

## Frontmatter fields that matter most

### `description`

Required. Keep it short and specific.

This is what helps OpenCode decide when to use the agent.

### `mode`

Usually use:

- `subagent` for specialized helpers
- `primary` for main workflows

### `temperature`

Use lower values for predictable tasks and higher values for creative tasks.

Rules of thumb:

- `0.0` to `0.2`: analysis, planning, auditing
- `0.3` to `0.5`: general product work
- `0.6` to `0.8`: copywriting, brainstorming, ideation

### `permission`

This controls what the agent can do.

Common keys:

- `read`
- `edit`
- `glob`
- `grep`
- `bash`
- `task`
- `webfetch`

Use `allow`, `ask`, or `deny`.

## Permission design by agent type

### Copywriting agent

Best when it can read surrounding UI copy and edit files directly.

Suggested permissions:

```yaml
permission:
  read: allow
  glob: allow
  grep: allow
  edit: allow
  bash: deny
  webfetch: deny
  task: deny
```

### Research agent

Best when it can explore broadly without changing anything.

Suggested permissions:

```yaml
permission:
  read: allow
  glob: allow
  grep: allow
  webfetch: allow
  edit: deny
  bash: deny
```

### Code review agent

Best when it stays focused on findings.

Suggested permissions:

```yaml
permission:
  read: allow
  glob: allow
  grep: allow
  edit: deny
  bash: deny
```

## Prompt design rules

### Give the agent domain context

Do not make the model guess what the product is.

Include:

- what Mentiohunt does
- who it serves
- what users are trying to accomplish
- what language the product should use

### Encode the product's point of view

Good agents reflect product strategy, not just style.

For Mentiohunt, useful beliefs include:

- actionability matters more than volume
- explainability matters more than black-box scoring
- recurring daily value matters more than one-time scans
- self-serve simplicity matters more than agency-style complexity

### Add explicit red lines

If a mistake would be costly, write it into the prompt.

For example:

- do not promise guaranteed backlinks
- do not present contact data as verified unless it is verified
- do not imply automated posting or commenting
- do not drift into generic SEO dashboard language

### Write for the actual audience

The prompt should reflect real buyer pain.

For Mentiohunt, useful audience truths include:

- founders do not want another noisy dashboard
- manual prospecting is repetitive and hard to sustain
- teams want to know what to do this week
- agencies need repeatable workflows for multiple clients
- people are skeptical of generic AI-written outreach

## Mentiohunt example: copywriter

This repo now includes:

```text
.opencode/agents/copywriter.md
```

This agent was designed to:

- write in a conversational founder-to-founder voice
- stay grounded in Mentiohunt's positioning
- understand founder and agency pain points
- avoid claims the product cannot support

Key prompt choices:

- it emphasizes opportunities, fit, rationale, next steps, and outreach angles
- it avoids hype-heavy SaaS language
- it avoids promising outcomes
- it makes clear the product finds opportunities but does not post on the user's behalf

## How to create a new agent

### Option 1. Create it manually

1. Add a file in `.opencode/agents/`
2. Name it after the agent, like `researcher.md`
3. Add frontmatter
4. Add the system prompt body
5. Save and invoke it with `@researcher`

### Option 2. Use OpenCode's generator

Run:

```bash
opencode agent create
```

This will guide you through:

1. where to save the agent
2. its description
3. prompt generation
4. permissions

The generated result is a strong starting point, but you should still edit the prompt to reflect Mentiohunt's actual product language and constraints.

## Testing an agent

Do not assume the first version is good.

Test agents with realistic prompts.

Examples:

```text
@copywriter rewrite this hero section for SaaS founders
@copywriter make this onboarding copy clearer and less generic
@copywriter give me three headline options for agencies
```

What to look for:

- does it stay in scope?
- does it use the right tone?
- does it overclaim?
- does it use Mentiohunt vocabulary correctly?
- does it make the product sound more actionable?

## Common mistakes

### Giving too many tools

If an agent does not need shell access, deny `bash`.

### Writing a vague description

Descriptions like "marketing helper" are too broad.

### Using a generic prompt

If the prompt could work for any SaaS product, it is probably not good enough.

### Forgetting avoid rules

If the product has important boundaries, put them in writing.

### Mixing too many jobs into one agent

If one agent is trying to do research, copywriting, positioning, and editing strategy at once, split it.

## Recommended starter agents for Mentiohunt

Good next agents for this repo:

1. `copywriter`
2. `positioning-reviewer`
3. `landing-page-editor`
4. `customer-researcher`
5. `onboarding-ux-writer`

Example directions:

- `positioning-reviewer`: read-only agent that checks whether copy matches Mentiohunt's positioning
- `customer-researcher`: read-only agent that summarizes pain points, objections, and language from source material
- `onboarding-ux-writer`: specialized agent for concise, helpful onboarding and empty-state copy

## Practical checklist

Before adding an agent, check:

1. Is the job specific?
2. Is `mode` correct?
3. Are permissions minimal?
4. Does the prompt include real product context?
5. Did you add explicit avoid rules?
6. Is the tone right for the intended work?
7. Can someone else on the team understand when to use it?

## Summary

The best OpenCode agents are narrow, opinionated, and grounded in the product they serve.

For Mentiohunt, that means agents should push toward:

- clear daily opportunities
- explainable fit
- useful outreach preparation
- plainspoken founder-friendly communication

If an agent helps the team move faster without drifting from that positioning, it is probably a good agent.
