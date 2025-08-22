/**
 * Token Balance Query
 * Handles SNIP-20/SNIP-25 token balance queries with proper SNIP-24 permit support
 */
import { QueryBuilder, QueryObject } from '../base';

export class BalanceQuery extends QueryBuilder {
  /**
   * Build the balance query object
   * For SNIP-24 permits, the address is derived from the signature
   * For viewing keys, the address must be specified in the auth method
   * @returns The balance query object
   */
  protected buildQuery(): QueryObject {
    // SNIP-24 compliant: balance query should be empty when using permits
    // The contract derives the address from the permit signature
    return {
      balance: {}
    };
  }
  
  getQueryType(): string {
    return 'token_balance';
  }
  
  /**
   * Static helper to create a balance query with fluent API
   * @returns New BalanceQuery instance
   */
  static create(): BalanceQuery {
    return new BalanceQuery();
  }
}

/**
 * Legacy Balance Query (with address)
 * For backward compatibility with viewing keys that require explicit address
 * @deprecated Use BalanceQuery with ViewingKeyAuth instead
 */
export class LegacyBalanceQuery extends QueryBuilder {
  private address?: string;
  
  /**
   * Set the address for legacy balance queries
   * @param address The address to query balance for
   * @returns This builder for chaining
   */
  forAddress(address: string): this {
    this.address = address;
    return this;
  }
  
  protected buildQuery(): QueryObject {
    if (!this.address) {
      throw new Error('Address is required for legacy balance query');
    }
    
    return {
      balance: {
        address: this.address
      }
    };
  }
  
  getQueryType(): string {
    return 'legacy_token_balance';
  }
}