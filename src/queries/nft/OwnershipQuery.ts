/**
 * NFT Ownership Query
 * Handles SNIP-721 NFT ownership queries
 */
import { QueryBuilder, QueryObject } from '../base';

export class NFTOwnershipQuery extends QueryBuilder {
  private owner?: string;
  private limit: number = 100;
  private startAfterToken?: string;
  
  /**
   * Set the owner address to query NFTs for
   * @param owner The owner address
   * @returns This builder for chaining
   */
  forOwner(owner: string): this {
    this.owner = owner;
    return this;
  }
  
  /**
   * Set the limit for number of NFTs to return
   * @param limit Maximum number of NFTs to return
   * @returns This builder for chaining
   */
  withLimit(limit: number): this {
    this.limit = limit;
    return this;
  }
  
  /**
   * Set pagination start point
   * @param tokenId Start after this token ID
   * @returns This builder for chaining
   */
  startAfter(tokenId: string): this {
    this.startAfterToken = tokenId;
    return this;
  }
  
  protected buildQuery(): QueryObject {
    if (!this.owner) {
      throw new Error('Owner address is required for NFT ownership query');
    }
    
    const query: any = {
      tokens: {
        owner: this.owner,
        limit: this.limit
      }
    };
    
    if (this.startAfterToken) {
      query.tokens.start_after = this.startAfterToken;
    }
    
    return query;
  }
  
  getQueryType(): string {
    return 'nft_ownership';
  }
  
  static forOwner(owner: string): NFTOwnershipQuery {
    return new NFTOwnershipQuery().forOwner(owner);
  }
  
  static create(): NFTOwnershipQuery {
    return new NFTOwnershipQuery();
  }
}