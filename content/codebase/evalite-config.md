---
filepath: evalite.config.ts
purpose: Minimal Evalite configuration for MCP testing
category: config
---

# Evalite Configuration

Minimal config that loads environment variables for test execution.

```ts
import { defineConfig } from 'evalite'

export default defineConfig({
  setupFiles: ['dotenv/config'],
})
```

## Purpose

Loads `.env` file before running evaluations, making `OPENAI_API_KEY` available.

## Environment Variables

Required in `.env`:

```
OPENAI_API_KEY=sk-...
```

## Usage

Evalite automatically loads this config when running:

```bash
pnpm eval
```

## Extensibility

Can add:

- Custom scorers
- Global test setup/teardown
- Model provider configuration
- Output formatting options

Example extended config:

```ts
export default defineConfig({
  setupFiles: ['dotenv/config'],
  scorers: {
    // Custom scoring functions
  },
  models: {
    // Model provider configs
  },
})
```

See [Evalite docs](https://evalite.dev/docs) for full options.
