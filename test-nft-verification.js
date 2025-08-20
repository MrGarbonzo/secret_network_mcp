#!/usr/bin/env node

/**
 * Test NFT verification specifically for a wallet with real NFTs
 */

const fetch = require('node-fetch');

const MCP_SERVER_URL = 'http://localhost:8002';

async function testNFTVerification() {
  console.log('🔍 Testing NFT Verification with Real Wallet');
  console.log('=' + '='.repeat(45));
  
  // Test with different wallets to check ownership
  const testWallets = [
    {
      name: 'Random wallet (should have no NFTs)',
      address: 'secret1ap26qrlp8mcq2pg6r47w43l0y8zkqm8a450s03'  // Valid random address
    },
    {
      name: 'Creator wallet (may have NFTs)',
      address: 'secret10tv6lx7sryfjsahv3k7he8l4l0fsv64gd9kfx2'  // Jack Robbins creator address
    }
  ];
  
  const contractAddress = 'secret10xgnqk9rfggdemk9qlfsvw4lkc4ph2sjhr7eav'; // Jack Robbins Collection
  
  for (const wallet of testWallets) {
    console.log(`\n📋 Testing: ${wallet.name}`);
    console.log(`   Address: ${wallet.address}`);
    
    try {
      // Query NFT ownership
      const query = {
        tokens: {
          owner: wallet.address,
          limit: 5
        }
      };
      
      const response = await fetch(`${MCP_SERVER_URL}/api/mcp/tools/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'secret_query_contract',
          arguments: {
            contractAddress: contractAddress,
            query: query
          }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('   ✅ Query successful');
        
        // Parse the result
        const content = result.result.content[0].text;
        console.log('   📄 Raw result:', content);
        
        // Extract the JSON from the result text
        const jsonMatch = content.match(/Contract Query Result:\n(.*)/s);
        if (jsonMatch) {
          try {
            const queryResult = JSON.parse(jsonMatch[1]);
            console.log('   📊 Parsed result:', JSON.stringify(queryResult, null, 2));
            
            // Check if tokens were found
            if (queryResult.tokens && Array.isArray(queryResult.tokens)) {
              console.log(`   🎯 Result: ${queryResult.tokens.length} tokens found`);
              if (queryResult.tokens.length > 0) {
                console.log('   🎉 NFTs owned:', queryResult.tokens.slice(0, 3));
              }
            } else if (queryResult.generic_err) {
              console.log('   ⚠️  Query error:', queryResult.generic_err.msg);
            }
          } catch (parseError) {
            console.log('   ❌ Failed to parse JSON result');
          }
        }
      } else {
        console.log('   ❌ Query failed:', result.error?.message || 'Unknown error');
      }
    } catch (error) {
      console.log('   ❌ Request failed:', error.message);
    }
  }
  
  console.log('\n🏁 NFT Verification Tests Complete');
}

testNFTVerification();