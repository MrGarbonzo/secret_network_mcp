/**
 * NFT Query Functions with SNIP-24 Permit Support
 * Implements correct with_permit wrapper structure
 */

import { 
  Permit, 
  WithPermitQuery, 
  NFTOwnershipQuery, 
  NFTMetadataQuery, 
  NFTPrivateMetadataQuery, 
  NFTBalanceQuery, 
  NFTTokensQuery,
  NFT_PERMIT_PERMISSIONS 
} from './types';
import { validatePermit, hasPermission, isTokenAllowed } from './validation';

export function createNFTOwnershipQuery(tokenId: string, permit: Permit, includeExpired?: boolean): WithPermitQuery {
  validatePermit(permit);
  
  if (!hasPermission(permit, NFT_PERMIT_PERMISSIONS.owner)) {
    throw new Error(`Permit does not have required permission: ${NFT_PERMIT_PERMISSIONS.owner}`);
  }
  
  if (!isTokenAllowed(permit, tokenId)) {
    throw new Error(`Token ${tokenId} is not allowed by this permit`);
  }

  const query: NFTOwnershipQuery = {
    owner_of: {
      token_id: tokenId,
      ...(includeExpired !== undefined && { include_expired: includeExpired })
    }
  };

  return {
    with_permit: {
      query,
      permit
    }
  };
}

export function createNFTMetadataQuery(tokenId: string, permit: Permit): WithPermitQuery {
  validatePermit(permit);
  
  if (!hasPermission(permit, NFT_PERMIT_PERMISSIONS.metadata)) {
    throw new Error(`Permit does not have required permission: ${NFT_PERMIT_PERMISSIONS.metadata}`);
  }
  
  if (!isTokenAllowed(permit, tokenId)) {
    throw new Error(`Token ${tokenId} is not allowed by this permit`);
  }

  const query: NFTMetadataQuery = {
    nft_info: {
      token_id: tokenId
    }
  };

  return {
    with_permit: {
      query,
      permit
    }
  };
}

export function createNFTPrivateMetadataQuery(tokenId: string, permit: Permit): WithPermitQuery {
  validatePermit(permit);
  
  if (!hasPermission(permit, NFT_PERMIT_PERMISSIONS.private_metadata)) {
    throw new Error(`Permit does not have required permission: ${NFT_PERMIT_PERMISSIONS.private_metadata}`);
  }
  
  if (!isTokenAllowed(permit, tokenId)) {
    throw new Error(`Token ${tokenId} is not allowed by this permit`);
  }

  const query: NFTPrivateMetadataQuery = {
    private_metadata: {
      token_id: tokenId
    }
  };

  return {
    with_permit: {
      query,
      permit
    }
  };
}

export function createNFTBalanceQuery(owner: string, permit: Permit): WithPermitQuery {
  validatePermit(permit);
  
  if (!hasPermission(permit, NFT_PERMIT_PERMISSIONS.balance)) {
    throw new Error(`Permit does not have required permission: ${NFT_PERMIT_PERMISSIONS.balance}`);
  }

  const query: NFTBalanceQuery = {
    balance: {
      owner
    }
  };

  return {
    with_permit: {
      query,
      permit
    }
  };
}

export function createNFTTokensQuery(
  owner: string, 
  permit: Permit, 
  startAfter?: string, 
  limit: number = 30
): WithPermitQuery {
  validatePermit(permit);
  
  if (!hasPermission(permit, NFT_PERMIT_PERMISSIONS.tokens)) {
    throw new Error(`Permit does not have required permission: ${NFT_PERMIT_PERMISSIONS.tokens}`);
  }

  const query: NFTTokensQuery = {
    tokens: {
      owner,
      ...(startAfter && { start_after: startAfter }),
      limit
    }
  };

  return {
    with_permit: {
      query,
      permit
    }
  };
}

export function createSimpleOwnershipCheck(tokenId: string, permit: Permit): WithPermitQuery {
  return createNFTOwnershipQuery(tokenId, permit, false);
}