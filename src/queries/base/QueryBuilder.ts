/**
 * Base query builder class for composable Secret Network queries
 * Provides a fluent interface for building authenticated queries
 */
import { AuthMethod, QueryObject, AuthenticatedQuery } from './AuthMethod';

export abstract class QueryBuilder {
  protected authMethod?: AuthMethod;
  
  /**
   * Set authentication method for this query
   * @param auth The authentication method to use
   * @returns This builder for chaining
   */
  withAuth(auth: AuthMethod): this {
    this.authMethod = auth;
    return this;
  }
  
  /**
   * Build the final query object ready to send to contracts
   * @returns Authenticated query object or raw query if no auth
   */
  build(): AuthenticatedQuery {
    const baseQuery = this.buildQuery();
    
    if (this.authMethod) {
      return this.authMethod.wrap(baseQuery);
    }
    
    return baseQuery;
  }
  
  /**
   * Build the base query object (to be implemented by subclasses)
   * @returns The base query object without authentication
   */
  protected abstract buildQuery(): QueryObject;
  
  /**
   * Get a description of this query type for logging
   */
  abstract getQueryType(): string;
}

/**
 * Base class for queries that don't require parameters
 */
export abstract class SimpleQueryBuilder extends QueryBuilder {
  // Simple queries like token info, contract info, etc.
}

/**
 * Base class for queries that require an address parameter
 */
export abstract class AddressQueryBuilder extends QueryBuilder {
  protected address?: string;
  
  /**
   * Set the address for this query
   * @param address The address to query for
   * @returns This builder for chaining
   */
  forAddress(address: string): this {
    this.address = address;
    return this;
  }
  
  protected validateAddress(): void {
    if (!this.address) {
      throw new Error(`Address is required for ${this.getQueryType()} query`);
    }
  }
}