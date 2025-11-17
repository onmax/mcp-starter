import { z } from 'zod'

// Pattern examples schema
export const GetPatternSchema = z.object({
  pattern: z.enum(['list-search', 'caching', 'validation', 'error-handling', 'pagination', 'auth']).describe('Which MCP pattern to get. Examples: "validation" for Zod schemas, "auth" for API key handling, "caching" for response caching'),
  format: z.enum(['code', 'explanation', 'both']).optional().default('both').describe('Return format: "code" for code only, "explanation" for docs only, "both" for complete guide'),
})

// Project scaffolding schema
export const CreateProjectSchema = z.object({
  data_source: z.enum(['api', 'database', 'file', 'custom']).describe('Data source type: "api" for REST APIs, "database" for SQL/NoSQL, "file" for markdown/JSON files, "custom" for other'),
  use_case: z.string().describe('What the MCP does in 2-5 words. Examples: "recipe API", "GitHub API", "Stripe payments", "PostgreSQL queries"'),
  auth_required: z.boolean().optional().default(false).describe('Set true if API requires authentication/API keys'),
})

// Debug helper schema
export const DebugSetupSchema = z.object({
  issue: z.enum(['tools-not-showing', 'cors-error', 'schema-validation', 'transport-setup', 'general']).describe('Issue type: "tools-not-showing" if tools missing in Claude, "cors-error" for CORS issues, "schema-validation" for Zod errors, "transport-setup" for connection problems, "general" for other'),
  error_message: z.string().optional().describe('Copy of actual error message (optional but helpful for better diagnosis)'),
})

// Prompt schemas
export const ScaffoldApiPromptSchema = z.object({
  api_description: z.string().describe('Description of the API to wrap (e.g., "GitHub REST API", "recipe search API")'),
})

export const AddToolPromptSchema = z.object({
  tool_purpose: z.string().describe('What the new tool should do'),
})
