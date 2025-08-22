/**
 * Token Allowance Query
 * Handles SNIP-20/SNIP-25 allowance queries with authentication support
 */
import { QueryBuilder, QueryObject } from '../base';

export class AllowanceQuery extends QueryBuilder {
  private owner?: string;
  private spender?: string;
  
  /**
   * Set the owner address for the allowance query
   * @param owner The owner address
   * @returns This builder for chaining
   */
  forOwner(owner: string): this {
    this.owner = owner;
    return this;
  }
  
  /**
   * Set the spender address for the allowance query
   * @param spender The spender address
   * @returns This builder for chaining
   */
  forSpender(spender: string): this {
    this.spender = spender;
    return this;
  }
  
  /**
   * Set both owner and spender addresses
   * @param owner The owner address
   * @param spender The spender address
   * @returns This builder for chaining
   */
  between(owner: string, spender: string): this {
    this.owner = owner;
    this.spender = spender;
    return this;
  }
  
  protected buildQuery(): QueryObject {
    if (!this.owner) {
      throw new Error('Owner address is required for allowance query');
    }
    
    if (!this.spender) {
      throw new Error('Spender address is required for allowance query');
    }
    
    return {
      allowance: {
        owner: this.owner,
        spender: this.spender
      }
    };
  }
  
  getQueryType(): string {
    return 'token_allowance';
  }
  
  /**
   * Static helper to create an allowance query
   * @param owner The owner address
   * @param spender The spender address
   * @returns New AllowanceQuery instance
   */
  static between(owner: string, spender: string): AllowanceQuery {
    return new AllowanceQuery().between(owner, spender);
  }
  
  static create(): AllowanceQuery {
    return new AllowanceQuery();
  }
}