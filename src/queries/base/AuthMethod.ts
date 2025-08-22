/**
 * Authentication method interface for Secret Network queries
 * Provides a clean abstraction for different auth types (permits, viewing keys, etc.)
 */
export interface AuthMethod {
  /**
   * Wrap a query object with authentication
   * @param query The base query object to wrap
   * @returns The authenticated query object ready to send to contracts
   */
  wrap(query: QueryObject): AuthenticatedQuery;
  
  /**
   * Get the authentication type for logging/debugging
   */
  getType(): string;
}

/**
 * Base query object structure
 */
export interface QueryObject {
  [key: string]: any;
}

/**
 * Authenticated query that can be sent to contracts
 */
export interface AuthenticatedQuery {
  [key: string]: any;
}

/**
 * SNIP-24 Permit structure
 */
export interface Permit {
  params: {
    permit_name: string;
    allowed_tokens: string[];
    permissions: string[];
    chain_id: string;
  };
  signature: {
    pub_key: {
      type: string;
      value: string;
    };
    signature: string;
  };
}

/**
 * Raw permit data that might contain extra fields from signing process
 */
export interface RawPermit {
  params?: {
    permit_name?: string;
    allowed_tokens?: string[];
    permissions?: string[];
    chain_id?: string;
  };
  signature?: {
    pub_key?: {
      type?: string;
      value?: string;
    };
    signature?: string;
  };
  // Extra fields that might come from signing process
  account_number?: string;
  sequence?: string;
  memo?: string;
  chain_id?: string;
  [key: string]: any;
}