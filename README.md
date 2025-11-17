# MCP Starter Template

A self-documenting MCP server template for building your own Model Context Protocol servers. This template is itself a working MCP server you can query to learn how to customize it.

## What This Template Provides

- **Documentation Access**: Query comprehensive guides on MCP patterns, setup, and customization
- **Code Exploration**: Explore the template's own implementation to learn patterns
- **Boilerplate Generation**: Generate tool/resource/prompt code based on this template
- **Testing Examples**: Evalite test suite showing how to validate MCP servers with LLMs

## Quick Start

### Prerequisites

- Node.js 18+ (run `fnm use 24` for Node 24)
- pnpm (`npm install -g pnpm`)
- OpenAI API key (for evaluations)

### Installation

```bash
pnpm install
```

### Development

Start the dev server:

```bash
pnpm dev
```

MCP server available at: `http://localhost:3000/mcp`

### Testing the MCP Server

**Option 1: MCP Inspector**

```bash
pnpm mcp:studio
```

**Option 2: Run Evaluations**

```bash
cp .env.example .env
# Add OPENAI_API_KEY to .env
pnpm eval
```

## Architecture

### Overview

Nuxt 4 application with MCP server on `/mcp` route using StreamableHTTPServerTransport.

### Content Sources

1. **Documentation** (`content/docs/`): README sections as queryable markdown
2. **Codebase** (GitHub): Template's own source code for pattern exploration

### MCP Capabilities

**Resources:**

- `resource://mcp-starter/documentation` - Doc sections index
- `resource://mcp-starter/codebase` - Code files index

**Tools:**

- `get_documentation` - Query docs (list/get/search modes)
- `get_code` - Explore code (list/get/search modes)
- `generate_mcp_boilerplate` - Generate tool/resource/prompt code

**Prompts:**

- `customize_template` - Step-by-step customization guide
- `understand_pattern` - Explain MCP patterns with examples

## Tool Design Patterns

### Consolidated Workflow Tools

Following MCP best practices, tools handle complete workflows instead of single operations:

**`get_documentation` handles:**

- List all sections (no params)
- Get specific section (`section` param)
- Search docs (`search_query` param)

**Why?** Reduces context overhead, mirrors user intent, easier for LLMs.

### List vs Search Pattern

**List**: When category/module known explicitly

- "Show me all documentation sections"
- "List code files in api-handlers category"

**Search**: When topic/task is conceptual

- "Find documentation about caching"
- "Search code for validation patterns"

## Testing Strategy

### Unit Tests

```bash
pnpm test
```

Covers:

- Tool registration
- Resource schemas
- Input validation
- Error messages

### Evaluations

```bash
pnpm eval        # Run evaluations
pnpm eval:ui     # View results UI
pnpm eval:watch  # Watch mode
```

10 realistic scenarios testing:

- Documentation queries
- Code exploration
- Boilerplate generation
- Multi-step workflows
- Edge cases

## Customizing This Template

### 1. Update Content Sources

Edit `content.config.ts` to point to your documentation and code:

```typescript
source: 'your-docs/**/*.md'
```

### 2. Modify Tools

Each tool in `server/api/mcp/*.ts`:

- Update Zod schemas for your parameters
- Modify handler logic for your data
- Keep caching strategy

### 3. Update Resources

Edit `server/routes/mcp.ts` resource registration:

- Change URIs to your namespace
- Update data fetching logic
- Keep JSON structure

### 4. Write Evaluations

Copy `tests/mcp/mcp.eval.ts`:

- Replace questions with your use cases
- Verify answers manually first
- Run frequently during development

## File Structure

```
server/
  routes/mcp.ts              # Main MCP server
  api/mcp/
    get-documentation.get.ts # Doc tool handler
    get-code.get.ts          # Code tool handler
    generate-mcp-boilerplate.get.ts # Generation tool
  utils/
    content.ts               # Markdown utilities
content/
  docs/                      # Documentation sections
tests/mcp/
  tools.test.ts              # Unit tests
  resources.test.ts
  prompts.test.ts
  mcp.eval.ts                # Evalite scenarios
```

## Best Practices from This Template

### Input Validation

- Zod schemas for all params
- Optional params with defaults
- Clear constraints

### Error Handling

- LLM-friendly error messages
- Suggest valid alternatives
- Guide to correct usage

### Caching

- 1-hour cache for content endpoints
- Custom cache keys per query
- Reduces load, improves response time

### Testing

- Unit tests for registration
- Evalite for LLM behavior
- 10+ realistic scenarios

## Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)
- [Nuxt Content](https://content.nuxt.com)
- [Evalite](https://evalite.dev)

## License

MIT
