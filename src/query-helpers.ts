/**
 * Query Helper Functions for Secret Network Tokens and NFTs
 * Provides formatted queries for SNIP-20, SNIP-25, and SNIP-721 standards
 */

/**
 * SNIP-20/25 Token Queries
 */

// Permit type definition for SNIP-24
export interface Permit {
  params: {
    permit_name: string;
    allowed_tokens: string[];
    permissions: string[];
  };
  signature: {
    pub_key: {
      type: string;
      value: string;
    };
    signature: string;
  };
}

// Query token balance with permit support
export function formatTokenBalanceQuery(address: string, viewingKey?: string, permit?: any) {
  if (permit) {
    // Clean and validate permit structure for SNIP-24
    // Remove any extra fields that shouldn't be in the final permit
    
    // Handle signature type compatibility
    let signature = permit.signature;
    if (signature?.pub_key?.type) {
      // Normalize pub_key type for compatibility
      // Some contracts expect 'tendermint/PubKeySecp256k1', others '/cosmos.crypto.secp256k1.PubKey'
      // Keep the original format as sent by Keplr
      signature = {
        ...signature,
        pub_key: {
          ...signature.pub_key,
          // Keep original type from Keplr - it should work with proper permit structure
          type: signature.pub_key.type
        }
      };
    }
    
    const cleanPermit = {
      params: {
        permit_name: permit.params?.permit_name,
        allowed_tokens: permit.params?.allowed_tokens,
        permissions: permit.params?.permissions,
        // Ensure chain_id is always in params (required for SNIP-24)
        chain_id: permit.params?.chain_id || permit.chain_id || "secret-4"
      },
      signature: signature
    };
    
    // Remove any undefined fields from params
    Object.keys(cleanPermit.params).forEach(key => {
      if (cleanPermit.params[key] === undefined) {
        delete cleanPermit.params[key];
      }
    });
    
    return {
      with_permit: {
        permit: cleanPermit,
        query: {
          balance: {
            address: address
          }
        }
      }
    };
  }
  
  if (viewingKey) {
    return {
      balance: {
        address: address,
        key: viewingKey
      }
    };
  }
  
  // Without viewing key or permit (will return error if token requires it)
  return {
    balance: {
      address: address
    }
  };
}

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

// Query allowance
export function formatAllowanceQuery(owner: string, spender: string, viewingKey?: string) {
  if (viewingKey) {
    return {
      allowance: {
        owner: owner,
        spender: spender,
        key: viewingKey
      }
    };
  }
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

// Query NFT tokens owned by address
export function formatNFTOwnershipQuery(owner: string, viewingKey?: string, limit: number = 100) {
  const query: any = {
    tokens: {
      owner: owner,
      limit: limit
    }
  };
  
  if (viewingKey) {
    query.tokens.viewer = {
      address: owner,
      viewing_key: viewingKey
    };
  }
  
  return query;
}

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

// Query NFT metadata by token ID
export function formatNFTMetadataQuery(tokenId: string, viewingKey?: string) {
  const query: any = {
    nft_info: {
      token_id: tokenId
    }
  };
  
  if (viewingKey) {
    query.nft_info.viewer = {
      viewing_key: viewingKey
    };
  }
  
  return query;
}

// Query all NFT metadata (includes private metadata if viewing key provided)
export function formatNFTAllInfoQuery(tokenId: string, viewingKey?: string) {
  const query: any = {
    all_nft_info: {
      token_id: tokenId
    }
  };
  
  if (viewingKey) {
    query.all_nft_info.viewer = {
      viewing_key: viewingKey
    };
  }
  
  return query;
}

// Query owner of specific NFT
export function formatNFTOwnerQuery(tokenId: string, viewingKey?: string) {
  const query: any = {
    owner_of: {
      token_id: tokenId
    }
  };
  
  if (viewingKey) {
    query.owner_of.viewer = {
      viewing_key: viewingKey
    };
  }
  
  return query;
}

// Query NFT approvals
export function formatNFTApprovalsQuery(tokenId: string, viewingKey?: string, includeExpired: boolean = false) {
  const query: any = {
    approvals: {
      token_id: tokenId,
      include_expired: includeExpired
    }
  };
  
  if (viewingKey) {
    query.approvals.viewer = {
      viewing_key: viewingKey
    };
  }
  
  return query;
}

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

/**
 * Helper to determine query type needed based on token standard
 */
export function getQueryForTokenType(
  tokenType: 'SNIP-20' | 'SNIP-25' | 'SNIP-721',
  queryType: 'balance' | 'info' | 'ownership',
  params: any
): any {
  switch (tokenType) {
    case 'SNIP-20':
    case 'SNIP-25':
      if (queryType === 'balance') {
        return formatTokenBalanceQuery(params.address, params.viewingKey, params.permit);
      } else if (queryType === 'info') {
        return formatTokenInfoQuery();
      }
      break;
      
    case 'SNIP-721':
      if (queryType === 'ownership') {
        return formatNFTOwnershipQuery(params.owner, params.viewingKey, params.limit);
      } else if (queryType === 'info') {
        return formatNFTContractInfoQuery();
      }
      break;
  }
  
  throw new Error(`Unsupported query type ${queryType} for token type ${tokenType}`);
}