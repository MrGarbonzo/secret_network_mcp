/**
 * SNIP-24 Permit Types for Secret Network
 * Based on official documentation and working Stashh implementation
 */

export interface PermitParams {
  permit_name: string;
  allowed_tokens: string[];
  permissions: string[];
  chain_id: string;
}

export interface PermitSignature {
  pub_key: {
    type: string;
    value: string;
  };
  signature: string;
}

export interface Permit {
  params: PermitParams;
  signature: PermitSignature;
}

export interface WithPermitQuery {
  with_permit: {
    query: any;
    permit: Permit;
  };
}

export interface NFTPermitPermissions {
  balance: string;
  history: string;
  metadata: string;
  owner: string;
  private_metadata: string;
  royalty_info: string;
  tokens: string;
  token_approvals: string;
  inventory_approvals: string;
}

export const NFT_PERMIT_PERMISSIONS: NFTPermitPermissions = {
  balance: "balance",
  history: "history", 
  metadata: "metadata",
  owner: "owner",
  private_metadata: "private_metadata",
  royalty_info: "royalty_info",
  tokens: "tokens",
  token_approvals: "token_approvals",
  inventory_approvals: "inventory_approvals"
};

export interface CreatePermitRequest {
  chain_id: string;
  contract_address: string;
  permit_name: string;
  allowed_tokens: string[];
  permissions: string[];
}

export interface NFTOwnershipQuery {
  owner_of: {
    token_id: string;
    include_expired?: boolean;
  };
}

export interface NFTMetadataQuery {
  nft_info: {
    token_id: string;
  };
}

export interface NFTPrivateMetadataQuery {
  private_metadata: {
    token_id: string;
  };
}

export interface NFTBalanceQuery {
  balance: {
    owner: string;
  };
}

export interface NFTTokensQuery {
  tokens: {
    owner: string;
    start_after?: string;
    limit?: number;
  };
}