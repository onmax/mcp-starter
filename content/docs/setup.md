---
title: Setup Guide
description: Installation and configuration instructions
section: setup
---

# Setup

## Prerequisites

- Node.js 18+ (recommended: Node 24 via `fnm use 24`)
- pnpm package manager
- Git
- OpenAI API key (for evaluations)

## Installation Steps

1. Clone or use as template:

```bash
git clone <your-fork>
cd mcp-starter
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment:

```bash
cp .env.example .env
# Add OPENAI_API_KEY=your-key
```

4. Start development server:

```bash
pnpm dev
```

## Verification

Test MCP server is running:

```bash
curl http://localhost:3000/mcp
```

Expected: Redirect to documentation or MCP server info

## Next Steps

- Open MCP Inspector: `pnpm mcp:studio`
- Run evaluations: `pnpm eval`
- Read architecture docs: Query `get_documentation` with `section: "architecture"`
