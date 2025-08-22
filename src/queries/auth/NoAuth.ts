/**
 * No Authentication (Public Queries)
 * For queries that don't require authentication (public token info, etc.)
 */
import { AuthMethod, QueryObject, AuthenticatedQuery } from '../base';

export class NoAuth implements AuthMethod {
  /**
   * Pass through the query without authentication
   * @param query The base query object
   * @returns The same query object (no authentication needed)
   */
  wrap(query: QueryObject): AuthenticatedQuery {
    return query;
  }
  
  getType(): string {
    return 'none';
  }
  
  /**
   * Get metadata about this auth method
   */
  getMetadata() {
    return {
      type: 'none',
      description: 'Public query requiring no authentication'
    };
  }
}