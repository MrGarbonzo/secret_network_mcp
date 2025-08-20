/**
 * Token Registry for Secret Network
 * Contains official token and NFT contract information from Secret Network documentation
 * Source: https://docs.scrt.network/secret-network-documentation/development/resources-api-contract-addresses/secret-token-contracts
 */

export interface TokenInfo {
  name: string;
  symbol: string;
  address: string;
  codeHash: string;
  decimals: number;
  type: 'SNIP-20' | 'SNIP-25';
  aliases: string[];
  category: 'native' | 'axelar' | 'ibc' | 'dex' | 'other';
}

export interface NFTInfo {
  name: string;
  symbol: string;
  address: string;
  codeHash?: string;
  type: 'SNIP-721';
  aliases: string[];
}

export interface TokenRegistry {
  tokens: Record<string, TokenInfo>;
  nfts: Record<string, NFTInfo>;
}

export const TOKEN_REGISTRY: TokenRegistry = {
  tokens: {
    // Native Secret Network Tokens
    'sSCRT': {
      name: 'Secret Secret',
      symbol: 'sSCRT',
      address: 'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek',
      codeHash: 'af74387e276be8874f07bec3a87023ee49b0e7ebe08178c49d0a49c3c98ed60e',
      decimals: 6,
      type: 'SNIP-20',
      aliases: ['sscrt', 'secret scrt', 'wrapped scrt'],
      category: 'native'
    },
    'SILK': {
      name: 'Silk Stablecoin',
      symbol: 'SILK',
      address: 'secret1fl449muk5yq8dlad7a22nje4p5d2pnsgymhjfd',
      codeHash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
      decimals: 6,
      type: 'SNIP-25',
      aliases: ['silk', 'silk stable', 'silk stablecoin'],
      category: 'native'
    },
    'SHD': {
      name: 'Shade Protocol',
      symbol: 'SHD',
      address: 'secret153wu605vvp934xhd4k9dtd640zsep5jkesstdm',
      codeHash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
      decimals: 8,
      type: 'SNIP-25',
      aliases: ['shd', 'shade', 'shade token'],
      category: 'native'
    },
    
    // Axelar Bridged Assets
    'saWETH': {
      name: 'Secret Axelar WETH',
      symbol: 'saWETH',
      address: 'secret139qfh3nmuzfgwsx2npnmnjl4hrvj3xq5rmq8a0',
      codeHash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
      decimals: 18,
      type: 'SNIP-25',
      aliases: ['saweth', 'weth', 'wrapped eth', 'axelar weth', 'secret weth', 'ethereum'],
      category: 'axelar'
    },
    'saUSDC': {
      name: 'Secret Axelar USDC',
      symbol: 'saUSDC',
      address: 'secret1vkq022x4q8t8kx9de3r84u669l65xnwf2lg3e6',
      codeHash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
      decimals: 6,
      type: 'SNIP-25',
      aliases: ['sausdc', 'usdc', 'axelar usdc', 'secret usdc'],
      category: 'axelar'
    },
    'saUSDT': {
      name: 'Secret Axelar USDT',
      symbol: 'saUSDT',
      address: 'secret1wk5j2cntwg2fgklf0uta3tlkvt87alfj7dzqyr',
      codeHash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
      decimals: 6,
      type: 'SNIP-25',
      aliases: ['sausdt', 'usdt', 'tether', 'axelar usdt', 'secret usdt'],
      category: 'axelar'
    },
    'saWBTC': {
      name: 'Secret Axelar WBTC',
      symbol: 'saWBTC',
      address: 'secret1g7jfnxmxkjgqdts9wlmn238mrzxz5r92zwqv4a',
      codeHash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
      decimals: 8,
      type: 'SNIP-25',
      aliases: ['sawbtc', 'wbtc', 'wrapped btc', 'bitcoin', 'axelar wbtc', 'secret wbtc'],
      category: 'axelar'
    },
    'saDAI': {
      name: 'Secret Axelar DAI',
      symbol: 'saDAI',
      address: 'secret1vnjck36ld45apf8u4fedxd5zy7f5l92y3w5qwq',
      codeHash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
      decimals: 18,
      type: 'SNIP-25',
      aliases: ['sadai', 'dai', 'axelar dai', 'secret dai'],
      category: 'axelar'
    },
    
    // IBC Bridged Assets
    'sATOM': {
      name: 'Secret ATOM',
      symbol: 'sATOM',
      address: 'secret19e75l25r6sa6nhdf4lggjmgpw0vmpfvsw5cnpe',
      codeHash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
      decimals: 6,
      type: 'SNIP-25',
      aliases: ['satom', 'atom', 'cosmos', 'secret atom'],
      category: 'ibc'
    },
    'sOSMO': {
      name: 'Secret OSMO',
      symbol: 'sOSMO',
      address: 'secret1zwwealwm0pcl9cul4nt6f38dsy6vzplw8lp3qg',
      codeHash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
      decimals: 6,
      type: 'SNIP-25',
      aliases: ['sosmo', 'osmo', 'osmosis', 'secret osmo'],
      category: 'ibc'
    },
    'sIST': {
      name: 'Secret IST',
      symbol: 'sIST',
      address: 'secret1xmqsk8tnge0atzy4e079h0l2wrgz6splcq0a24',
      codeHash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
      decimals: 6,
      type: 'SNIP-25',
      aliases: ['sist', 'ist', 'inter stable', 'secret ist'],
      category: 'ibc'
    },
    'sSTRD': {
      name: 'Secret STRD',
      symbol: 'sSTRD',
      address: 'secret1mqg86m7khunwljmnxlmgwhyqgvrp5ts0kmr8l0',
      codeHash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
      decimals: 6,
      type: 'SNIP-25',
      aliases: ['sstrd', 'strd', 'stride', 'secret stride'],
      category: 'ibc'
    },
    
    // DEX/AMM Tokens
    'AMBER': {
      name: 'Amber',
      symbol: 'AMBER',
      address: 'secret1s09x2xvfd2lp2skgzm29w2xtena7s8fq98v852',
      codeHash: '5a085bd8ed89de92b35134ddd12505a602c7759ea25fb5c089ba03c8535b3042',
      decimals: 6,
      type: 'SNIP-20',
      aliases: ['amber', 'secret swap'],
      category: 'dex'
    },
    'ALTER': {
      name: 'Alter',
      symbol: 'ALTER',
      address: 'secret1uknu66lctqpwap76d0nqxhvnmj8c5prpnyvy7x',
      codeHash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
      decimals: 6,
      type: 'SNIP-25',
      aliases: ['alter', 'secret alter'],
      category: 'native'
    }
  },
  
  nfts: {
    'jack_robbins': {
      name: 'Jack Robbins Collection',
      symbol: 'JRC',
      address: 'secret10xgnqk9rfggdemk9qlfsvw4lkc4ph2sjhr7eav',
      type: 'SNIP-721',
      aliases: ['jack robbins', 'jrc', 'jack robbins nft', 'jack robbins collection']
    },
    'anons': {
      name: 'Anons NFT',
      symbol: 'ANONS',
      address: 'secret1wn5z803xj5p77dd05c0lcmyea9rn89a0vxsndz',
      type: 'SNIP-721',
      aliases: ['anons', 'anons nft', 'secret anons']
    },
    'secret_badgers': {
      name: 'Secret Badgers',
      symbol: 'BADGER',
      address: 'secret1pfmm8umukdqehuw2390m5dm8ejy3cul8aztwte',
      type: 'SNIP-721',
      aliases: ['badgers', 'secret badgers', 'badger nft']
    }
  }
};

/**
 * Helper function to find a token by name, symbol, or alias
 */
export function findToken(query: string): TokenInfo | undefined {
  const queryLower = query.toLowerCase().trim();
  
  for (const [key, token] of Object.entries(TOKEN_REGISTRY.tokens)) {
    // Check symbol match
    if (token.symbol.toLowerCase() === queryLower) {
      return token;
    }
    
    // Check name match
    if (token.name.toLowerCase().includes(queryLower)) {
      return token;
    }
    
    // Check aliases
    if (token.aliases.some(alias => alias === queryLower)) {
      return token;
    }
  }
  
  return undefined;
}

/**
 * Helper function to find an NFT collection by name, symbol, or alias
 */
export function findNFT(query: string): NFTInfo | undefined {
  const queryLower = query.toLowerCase().trim();
  
  for (const [key, nft] of Object.entries(TOKEN_REGISTRY.nfts)) {
    // Check symbol match
    if (nft.symbol.toLowerCase() === queryLower) {
      return nft;
    }
    
    // Check name match
    if (nft.name.toLowerCase().includes(queryLower)) {
      return nft;
    }
    
    // Check aliases
    if (nft.aliases.some(alias => alias === queryLower)) {
      return nft;
    }
  }
  
  return undefined;
}

/**
 * Get all tokens of a specific category
 */
export function getTokensByCategory(category: TokenInfo['category']): TokenInfo[] {
  return Object.values(TOKEN_REGISTRY.tokens).filter(token => token.category === category);
}

/**
 * List all available token symbols
 */
export function listTokenSymbols(): string[] {
  return Object.values(TOKEN_REGISTRY.tokens).map(token => token.symbol);
}

/**
 * List all available NFT collections
 */
export function listNFTCollections(): string[] {
  return Object.values(TOKEN_REGISTRY.nfts).map(nft => nft.name);
}