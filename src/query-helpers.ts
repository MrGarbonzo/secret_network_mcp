/**
 * Query Helper Functions for Secret Network Tokens and NFTs
 * Provides formatted queries for SNIP-20, SNIP-25, and SNIP-721 standards
 */

/**
 * SNIP-20/25 Token Queries
 */

// NOTE: All permit/viewing key functionality removed
// Will be rebuilt with correct SNIP-24 structure in new permit modules

// Query token info (name, symbol, decimals, total supply)
export function formatTokenInfoQuery() {
  return {
    token_info: {}
  };
}

// Query token config
export function formatTokenConfigQuery() {
  return {
    token_config: {}
  };
}

// Query exchange rate (for wrapped tokens)
export function formatExchangeRateQuery() {
  return {
    exchange_rate: {}
  };
}

// Query allowance (public only, permit support will be added in new permit modules)
export function formatAllowanceQuery(owner: string, spender: string) {
  return {
    allowance: {
      owner: owner,
      spender: spender
    }
  };
}

// Query minters (SNIP-25)
export function formatMintersQuery() {
  return {
    minters: {}
  };
}

/**
 * SNIP-721 NFT Queries
 */

// NOTE: NFT ownership queries with permits will be handled by new permit modules
// This function removed to avoid confusion with broken viewing key implementation

// Query all tokens (public NFTs)
export function formatAllTokensQuery(startAfter?: string, limit: number = 30) {
  const query: any = {
    all_tokens: {
      limit: limit
    }
  };
  
  if (startAfter) {
    query.all_tokens.start_after = startAfter;
  }
  
  return query;
}

// Query NFT contract info
export function formatNFTContractInfoQuery() {
  return {
    contract_info: {}
  };
}

// NOTE: All NFT queries with viewing keys removed
// Private NFT queries will be handled by new permit-based functions

// Query number of tokens
export function formatNumTokensQuery() {
  return {
    num_tokens: {}
  };
}

// Query tokens for sale (if marketplace enabled)
export function formatTokensForSaleQuery(limit: number = 30) {
  return {
    tokens_for_sale: {
      limit: limit
    }
  };
}

/**
 * Batch Query Helper
 */
export function formatBatchQuery(queries: any[]) {
  return {
    batch: {
      queries: queries
    }
  };
}

// NOTE: Helper function removed - was using broken permit/viewing key functions
// Will be replaced with permit-aware helper functions in new implementation