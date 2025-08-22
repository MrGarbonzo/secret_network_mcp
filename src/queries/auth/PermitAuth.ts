/**
 * SNIP-24 Permit Authentication
 * Handles proper permit structure validation and query wrapping
 */
import { AuthMethod, QueryObject, AuthenticatedQuery, Permit, RawPermit } from '../base';

export class PermitAuth implements AuthMethod {
  private permit: Permit;
  
  constructor(rawPermit: RawPermit) {
    this.permit = this.cleanAndValidatePermit(rawPermit);
  }
  
  /**
   * Wrap a query with SNIP-24 permit authentication
   * @param query The base query object
   * @returns SNIP-24 compliant with_permit query
   */
  wrap(query: QueryObject): AuthenticatedQuery {
    return {
      with_permit: {
        permit: this.permit,
        query: query
      }
    };
  }
  
  getType(): string {
    return 'permit';
  }
  
  /**
   * Get the permit data for debugging
   */
  getPermit(): Permit {
    return this.permit;
  }
  
  /**
   * Clean and validate raw permit data to SNIP-24 standard
   * @param rawPermit Raw permit that might have extra fields
   * @returns Clean SNIP-24 compliant permit
   */
  private cleanAndValidatePermit(rawPermit: RawPermit): Permit {
    // Validate required fields exist
    if (!rawPermit.params) {
      throw new Error('Invalid permit: missing params object');
    }
    
    if (!rawPermit.signature) {
      throw new Error('Invalid permit: missing signature object');
    }
    
    if (!rawPermit.signature.pub_key) {
      throw new Error('Invalid permit: missing signature.pub_key');
    }
    
    if (!rawPermit.signature.signature) {
      throw new Error('Invalid permit: missing signature.signature');
    }
    
    // Extract and validate params
    const params = rawPermit.params;
    
    if (!params.permit_name) {
      throw new Error('Invalid permit: missing permit_name');
    }
    
    if (!params.allowed_tokens || !Array.isArray(params.allowed_tokens)) {
      throw new Error('Invalid permit: missing or invalid allowed_tokens array');
    }
    
    if (!params.permissions || !Array.isArray(params.permissions)) {
      throw new Error('Invalid permit: missing or invalid permissions array');
    }
    
    // Get chain_id from params or fallback to root level or default
    const chainId = params.chain_id || rawPermit.chain_id || 'secret-4';
    
    // Validate signature structure
    const signature = rawPermit.signature;
    if (!signature.pub_key.type || !signature.pub_key.value) {
      throw new Error('Invalid permit: incomplete pub_key structure');
    }
    
    // Create clean SNIP-24 compliant permit
    const cleanPermit: Permit = {
      params: {
        permit_name: params.permit_name,
        allowed_tokens: [...params.allowed_tokens], // Clone array
        permissions: [...params.permissions], // Clone array
        chain_id: chainId
      },
      signature: {
        pub_key: {
          type: signature.pub_key.type,
          value: signature.pub_key.value
        },
        signature: signature.signature
      }
    };
    
    // Log permit validation details
    console.log('✅ PERMIT VALIDATION:', {
      hasParams: !!rawPermit.params,
      hasSignature: !!rawPermit.signature,
      hasPermitName: !!params.permit_name,
      hasAllowedTokens: !!(params.allowed_tokens && params.allowed_tokens.length > 0),
      hasPermissions: !!(params.permissions && params.permissions.length > 0),
      hasChainId: !!chainId,
      hasPubKey: !!(signature.pub_key && signature.pub_key.type && signature.pub_key.value),
      hasSignatureValue: !!signature.signature,
      cleanedExtraFields: this.getExtraFields(rawPermit)
    });
    
    return cleanPermit;
  }
  
  /**
   * Identify extra fields that were removed during cleaning
   * @param rawPermit The original raw permit
   * @returns List of extra field names that were removed
   */
  private getExtraFields(rawPermit: RawPermit): string[] {
    const extraFields: string[] = [];
    const allowedFields = ['params', 'signature'];
    
    for (const field in rawPermit) {
      if (!allowedFields.includes(field)) {
        extraFields.push(field);
      }
    }
    
    return extraFields;
  }
  
  /**
   * Validate that this permit covers a specific token
   * @param tokenAddress The token contract address to check
   * @returns True if permit covers this token
   */
  coversToken(tokenAddress: string): boolean {
    return this.permit.params.allowed_tokens.includes(tokenAddress);
  }
  
  /**
   * Check if permit has specific permission
   * @param permission The permission to check for
   * @returns True if permit has this permission
   */
  hasPermission(permission: string): boolean {
    return this.permit.params.permissions.includes(permission);
  }
  
  /**
   * Get permit expiry info (permits don't have built-in expiry, but can be cached with TTL)
   * @returns Permit metadata for caching/debugging
   */
  getMetadata() {
    return {
      permitName: this.permit.params.permit_name,
      tokenCount: this.permit.params.allowed_tokens.length,
      permissions: this.permit.params.permissions,
      chainId: this.permit.params.chain_id,
      pubKeyType: this.permit.signature.pub_key.type
    };
  }
}