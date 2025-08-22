/**
 * Secret Network Query System
 * Clean, composable query builders for Secret Network contracts
 */

// Base architecture
export * from './base';

// Authentication methods
export * from './auth';

// Token queries
export * from './token';

// NFT queries  
export * from './nft';

// Convenience factory functions
import { BalanceQuery } from './token/BalanceQuery';
import { TokenInfoQuery } from './token/InfoQuery';
import { AllowanceQuery } from './token/AllowanceQuery';
import { NFTOwnershipQuery } from './nft/OwnershipQuery';
import { PermitAuth, ViewingKeyAuth, NoAuth } from './auth';
import { RawPermit } from './base';

/**
 * Query factory functions for common use cases
 */
export class QueryFactory {
  /**
   * Create a token balance query with permit authentication
   * @param rawPermit Raw permit data from frontend
   * @returns Ready-to-execute authenticated query
   */
  static tokenBalanceWithPermit(rawPermit: RawPermit) {
    const permitAuth = new PermitAuth(rawPermit);
    return BalanceQuery.create().withAuth(permitAuth);
  }
  
  /**
   * Create a token balance query with viewing key authentication
   * @param address The address to query balance for
   * @param viewingKey The viewing key for authentication
   * @returns Ready-to-execute authenticated query
   */
  static tokenBalanceWithViewingKey(address: string, viewingKey: string) {
    const viewingKeyAuth = new ViewingKeyAuth(address, viewingKey);
    return BalanceQuery.create().withAuth(viewingKeyAuth);
  }
  
  /**
   * Create a public token info query (no authentication needed)
   * @returns Ready-to-execute public query
   */
  static tokenInfo() {
    return TokenInfoQuery.create().withAuth(new NoAuth());
  }
  
  /**
   * Create an allowance query with permit authentication
   * @param owner The owner address
   * @param spender The spender address
   * @param rawPermit Raw permit data from frontend
   * @returns Ready-to-execute authenticated query
   */
  static allowanceWithPermit(owner: string, spender: string, rawPermit: RawPermit) {
    const permitAuth = new PermitAuth(rawPermit);
    return AllowanceQuery.between(owner, spender).withAuth(permitAuth);
  }
  
  /**
   * Create an NFT ownership query with permit authentication
   * @param owner The owner address
   * @param rawPermit Raw permit data from frontend
   * @returns Ready-to-execute authenticated query
   */
  static nftOwnershipWithPermit(owner: string, rawPermit: RawPermit) {
    const permitAuth = new PermitAuth(rawPermit);
    return NFTOwnershipQuery.forOwner(owner).withAuth(permitAuth);
  }
}