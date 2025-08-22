/**
 * Query Adapters
 * Backward compatibility layer that wraps the new query system
 * with the old function signatures for easy migration
 */
import { QueryFactory, PermitAuth, ViewingKeyAuth, NoAuth, BalanceQuery, TokenInfoQuery } from './queries';
import type { RawPermit, AuthenticatedQuery } from './queries';

/**
 * Backward compatible token balance query function
 * @param address The address parameter (ignored for permit queries, used for viewing key queries)
 * @param viewingKey Optional viewing key for authentication
 * @param permit Optional permit for authentication
 * @returns Formatted query object ready for Secret Network
 */
export function formatTokenBalanceQuery(address: string, viewingKey?: string, permit?: any): AuthenticatedQuery {
  if (permit) {
    // Use new permit-based query system
    try {
      const query = QueryFactory.tokenBalanceWithPermit(permit as RawPermit);
      const result = query.build();
      
      console.log('🔑 QUERY DEBUG - Using new permit auth system');
      console.log('🔑 QUERY DEBUG - Formatted query:', JSON.stringify(result, null, 2));
      
      return result;
    } catch (error) {
      console.error('❌ New permit system failed, falling back to legacy:', error);
      
      // Fallback to legacy permit handling
      return formatLegacyPermitQuery(permit);
    }
  }
  
  if (viewingKey) {
    // Use new viewing key query system
    const query = QueryFactory.tokenBalanceWithViewingKey(address, viewingKey);
    return query.build();
  }
  
  // No authentication - public query (will likely fail for private tokens)
  const query = BalanceQuery.create().withAuth(new NoAuth());
  return query.build();
}

/**
 * Legacy permit handling for backward compatibility
 * @param permit Raw permit object
 * @returns Legacy formatted query
 */
function formatLegacyPermitQuery(permit: any): AuthenticatedQuery {
  // This is the old logic from the original query-helpers.ts
  // Keep it as fallback in case the new system has issues
  
  let signature = permit.signature;
  if (signature?.pub_key?.type) {
    signature = {
      ...signature,
      pub_key: {
        ...signature.pub_key,
        type: signature.pub_key.type
      }
    };
  }
  
  const cleanPermit = {
    params: {
      permit_name: permit.params?.permit_name,
      allowed_tokens: permit.params?.allowed_tokens,
      permissions: permit.params?.permissions,
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
  
  console.log('🔄 FALLBACK - Using legacy permit handling');
  
  return {
    with_permit: {
      permit: cleanPermit,
      query: {
        balance: {}
      }
    }
  };
}

/**
 * Backward compatible token info query function
 * @returns Formatted token info query
 */
export function formatTokenInfoQuery(): AuthenticatedQuery {
  const query = QueryFactory.tokenInfo();
  return query.build();
}

/**
 * Backward compatible token config query function
 * @returns Formatted token config query
 */
export function formatTokenConfigQuery(): AuthenticatedQuery {
  return {
    token_config: {}
  };
}

/**
 * Backward compatible exchange rate query function
 * @returns Formatted exchange rate query
 */
export function formatExchangeRateQuery(): AuthenticatedQuery {
  return {
    exchange_rate: {}
  };
}

/**
 * Backward compatible allowance query function
 * @param owner The owner address
 * @param spender The spender address
 * @param viewingKey Optional viewing key
 * @returns Formatted allowance query
 */
export function formatAllowanceQuery(owner: string, spender: string, viewingKey?: string): AuthenticatedQuery {
  if (viewingKey) {
    const viewingKeyAuth = new ViewingKeyAuth(owner, viewingKey);
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

/**
 * Backward compatible minters query function
 * @returns Formatted minters query
 */
export function formatMintersQuery(): AuthenticatedQuery {
  return {
    minters: {}
  };
}

// Re-export all the NFT and batch query functions unchanged for now
export {
  formatNFTOwnershipQuery,
  formatAllTokensQuery,
  formatNFTContractInfoQuery,
  formatNFTMetadataQuery,
  formatNFTAllInfoQuery,
  formatNFTOwnerQuery,
  formatNFTApprovalsQuery,
  formatNumTokensQuery,
  formatTokensForSaleQuery,
  formatBatchQuery,
  getQueryForTokenType
} from './query-helpers';