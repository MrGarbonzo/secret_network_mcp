/**
 * Permit Validation Functions
 * Validates SNIP-24 permit structure and parameters
 */

import { Permit, PermitParams, PermitSignature, NFT_PERMIT_PERMISSIONS } from './types';

export class PermitValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermitValidationError';
  }
}

export function validatePermitParams(params: any): params is PermitParams {
  if (!params || typeof params !== 'object') {
    throw new PermitValidationError('Permit params must be an object');
  }

  if (!params.permit_name || typeof params.permit_name !== 'string') {
    throw new PermitValidationError('permit_name is required and must be a string');
  }

  if (!params.chain_id || typeof params.chain_id !== 'string') {
    throw new PermitValidationError('chain_id is required and must be a string');
  }

  if (!Array.isArray(params.allowed_tokens)) {
    throw new PermitValidationError('allowed_tokens must be an array');
  }

  if (!Array.isArray(params.permissions)) {
    throw new PermitValidationError('permissions must be an array');
  }

  if (params.permissions.length === 0) {
    throw new PermitValidationError('permissions array cannot be empty');
  }

  return true;
}

export function validatePermitSignature(signature: any): signature is PermitSignature {
  if (!signature || typeof signature !== 'object') {
    throw new PermitValidationError('Permit signature must be an object');
  }

  if (!signature.pub_key || typeof signature.pub_key !== 'object') {
    throw new PermitValidationError('pub_key is required and must be an object');
  }

  if (!signature.pub_key.type || typeof signature.pub_key.type !== 'string') {
    throw new PermitValidationError('pub_key.type is required and must be a string');
  }

  if (!signature.pub_key.value || typeof signature.pub_key.value !== 'string') {
    throw new PermitValidationError('pub_key.value is required and must be a string');
  }

  if (!signature.signature || typeof signature.signature !== 'string') {
    throw new PermitValidationError('signature is required and must be a string');
  }

  return true;
}

export function validatePermit(permit: any): permit is Permit {
  if (!permit || typeof permit !== 'object') {
    throw new PermitValidationError('Permit must be an object');
  }

  validatePermitParams(permit.params);
  validatePermitSignature(permit.signature);

  return true;
}

export function validateNFTPermissions(permissions: string[]): boolean {
  const validPermissions = Object.values(NFT_PERMIT_PERMISSIONS);
  
  for (const permission of permissions) {
    if (!validPermissions.includes(permission)) {
      throw new PermitValidationError(`Invalid NFT permission: ${permission}. Valid permissions: ${validPermissions.join(', ')}`);
    }
  }

  return true;
}

export function hasPermission(permit: Permit, requiredPermission: string): boolean {
  return permit.params.permissions.includes(requiredPermission);
}

export function isTokenAllowed(permit: Permit, tokenId: string): boolean {
  return permit.params.allowed_tokens.length === 0 || permit.params.allowed_tokens.includes(tokenId);
}