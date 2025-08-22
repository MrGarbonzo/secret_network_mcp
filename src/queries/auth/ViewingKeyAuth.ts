/**
 * Viewing Key Authentication
 * Handles traditional viewing key authentication for Secret Network queries
 */
import { AuthMethod, QueryObject, AuthenticatedQuery } from '../base';

export class ViewingKeyAuth implements AuthMethod {
  constructor(
    private address: string,
    private viewingKey: string
  ) {
    if (!address) {
      throw new Error('Address is required for viewing key authentication');
    }
    if (!viewingKey) {
      throw new Error('Viewing key is required for viewing key authentication');
    }
  }
  
  /**
   * Wrap a query with viewing key authentication
   * @param query The base query object
   * @returns Query with viewing key authentication
   */
  wrap(query: QueryObject): AuthenticatedQuery {
    // For viewing key auth, we need to add the key and address to the query itself
    // This is different from permits which wrap the entire query
    
    if ('balance' in query) {
      return {
        balance: {
          address: this.address,
          key: this.viewingKey
        }
      };
    }
    
    if ('allowance' in query && query.allowance) {
      return {
        allowance: {
          ...query.allowance,
          key: this.viewingKey
        }
      };
    }
    
    if ('transfer_history' in query) {
      return {
        transfer_history: {
          ...query.transfer_history,
          address: this.address,
          key: this.viewingKey
        }
      };
    }
    
    if ('transaction_history' in query) {
      return {
        transaction_history: {
          ...query.transaction_history,
          address: this.address,
          key: this.viewingKey
        }
      };
    }
    
    // For other query types, add viewing key if it's a structure that supports it
    if (typeof query === 'object' && query !== null) {
      return {
        ...query,
        viewer: {
          address: this.address,
          viewing_key: this.viewingKey
        }
      };
    }
    
    throw new Error(`Viewing key authentication not supported for query type: ${Object.keys(query).join(', ')}`);
  }
  
  getType(): string {
    return 'viewing_key';
  }
  
  /**
   * Get the address associated with this viewing key
   */
  getAddress(): string {
    return this.address;
  }
  
  /**
   * Get metadata about this auth method (without exposing the key)
   */
  getMetadata() {
    return {
      type: 'viewing_key',
      address: this.address,
      hasKey: !!this.viewingKey
    };
  }
}