/**
 * Token Info Query
 * Handles SNIP-20/SNIP-25 token information queries (name, symbol, decimals, etc.)
 */
import { SimpleQueryBuilder, QueryObject } from '../base';

export class TokenInfoQuery extends SimpleQueryBuilder {
  /**
   * Build the token info query object
   * This is a public query that doesn't require authentication
   * @returns The token info query object
   */
  protected buildQuery(): QueryObject {
    return {
      token_info: {}
    };
  }
  
  getQueryType(): string {
    return 'token_info';
  }
  
  /**
   * Static helper to create a token info query
   * @returns New TokenInfoQuery instance
   */
  static create(): TokenInfoQuery {
    return new TokenInfoQuery();
  }
}

/**
 * Token Config Query
 * Query token configuration parameters
 */
export class TokenConfigQuery extends SimpleQueryBuilder {
  protected buildQuery(): QueryObject {
    return {
      token_config: {}
    };
  }
  
  getQueryType(): string {
    return 'token_config';
  }
  
  static create(): TokenConfigQuery {
    return new TokenConfigQuery();
  }
}

/**
 * Exchange Rate Query
 * For wrapped tokens that have exchange rates
 */
export class ExchangeRateQuery extends SimpleQueryBuilder {
  protected buildQuery(): QueryObject {
    return {
      exchange_rate: {}
    };
  }
  
  getQueryType(): string {
    return 'exchange_rate';
  }
  
  static create(): ExchangeRateQuery {
    return new ExchangeRateQuery();
  }
}

/**
 * Minters Query
 * For SNIP-25 tokens, query the list of minters
 */
export class MintersQuery extends SimpleQueryBuilder {
  protected buildQuery(): QueryObject {
    return {
      minters: {}
    };
  }
  
  getQueryType(): string {
    return 'minters';
  }
  
  static create(): MintersQuery {
    return new MintersQuery();
  }
}