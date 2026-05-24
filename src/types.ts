/**
 * Core type definitions for n8n-mcp
 * Shared interfaces and types used across the application
 */

/** Supported n8n node categories */
export type NodeCategory =
  | 'trigger'
  | 'action'
  | 'transform'
  | 'condition'
  | 'output'
  | 'utility';

/** Represents a single n8n node definition */
export interface N8nNode {
  name: string;
  displayName: string;
  description: string;
  version: number | number[];
  category: NodeCategory;
  properties: NodeProperty[];
  credentials?: NodeCredential[];
  inputs: string[];
  outputs: string[];
  icon?: string;
  group?: string[];
  subtitle?: string;
  defaults: Record<string, unknown>;
}

/** A single configurable property on an n8n node */
export interface NodeProperty {
  displayName: string;
  name: string;
  type: NodePropertyType;
  default: unknown;
  description?: string;
  required?: boolean;
  options?: NodePropertyOption[];
  placeholder?: string;
  noDataExpression?: boolean;
  displayOptions?: DisplayOptions;
}

/** Valid types for node properties */
export type NodePropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'options'
  | 'multiOptions'
  | 'collection'
  | 'fixedCollection'
  | 'json'
  | 'color'
  | 'dateTime'
  | 'hidden';

/** An option within a dropdown/select property */
export interface NodePropertyOption {
  name: string;
  value: string | number | boolean;
  description?: string;
}

/** Credential type required by a node */
export interface NodeCredential {
  name: string;
  required: boolean;
  displayOptions?: DisplayOptions;
}

/** Controls when a property or credential is shown */
export interface DisplayOptions {
  show?: Record<string, Array<string | number | boolean>>;
  hide?: Record<string, Array<string | number | boolean>>;
}

/** MCP tool definition returned to the client */
export interface McpTool {
  name: string;
  description: string;
  inputSchema: JsonSchema;
}

/** Minimal JSON Schema subset used for MCP tool inputs */
export interface JsonSchema {
  type: 'object';
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface JsonSchemaProperty {
  type: string | string[];
  description?: string;
  enum?: unknown[];
  default?: unknown;
  items?: JsonSchemaProperty;
}

/** Result of a tool invocation */
export interface ToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

/** Search/filter parameters for node queries */
export interface NodeSearchParams {
  query?: string;
  category?: NodeCategory;
  limit?: number;
  offset?: number;
}
