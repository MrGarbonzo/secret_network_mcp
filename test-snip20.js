#!/usr/bin/env node

/**
 * Test SNIP-20 token queries (sETH, sUSDC) to verify dynamic code hash resolver
 */

const fetch = require('node-fetch');

const MCP_SERVER_URL = 'http://localhost:8002';

async function testSNIP20Queries() {
  console.log('💰 Testing SNIP-20 Token Queries');
  console.log('=' + '='.repeat(35));
  
  // Test different SNIP-20 contracts
  const testContracts = [
    {
      name: 'sETH (Axelar)',
      address: 'secret139qfh3nmuzfgwsx2npnmnjl4hrvj3xq5rmq8a0',
      queries: [
        {
          name: 'Token Info',
          query: { token_info: {} }
        }
      ]
    },
    {
      name: 'sSCRT (Secret SCRT)',
      address: 'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek',
      queries: [
        {
          name: 'Token Info',
          query: { token_info: {} }
        }
      ]
    },
    {
      name: 'Jack Robbins Collection (SNIP-721)',
      address: 'secret10xgnqk9rfggdemk9qlfsvw4lkc4ph2sjhr7eav',
      queries: [
        {
          name: 'Contract Info',
          query: { contract_info: {} }
        },
        {
          name: 'Num Tokens',
          query: { num_tokens: {} }
        }
      ]
    }
  ];
  
  for (const contract of testContracts) {
    console.log(`\n🪙 Testing: ${contract.name}`);
    console.log(`   Address: ${contract.address}`);
    
    for (const queryTest of contract.queries) {
      console.log(`\n   📋 Query: ${queryTest.name}`);
      
      try {
        const response = await fetch(`${MCP_SERVER_URL}/api/mcp/tools/call`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'secret_query_contract',
            arguments: {
              contractAddress: contract.address,
              query: queryTest.query
            }
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log('      ✅ Query successful');
          
          // Parse the result
          const content = result.result.content[0].text;
          const jsonMatch = content.match(/Contract Query Result:\n(.*)/s);
          
          if (jsonMatch) {
            try {
              const queryResult = JSON.parse(jsonMatch[1]);
              console.log('      📊 Result:', JSON.stringify(queryResult, null, 6));
            } catch (parseError) {
              console.log('      📄 Raw result:', content);
            }
          }
        } else {
          console.log('      ❌ Query failed:', result.error?.message || 'Unknown error');
        }
      } catch (error) {
        console.log('      ❌ Request failed:', error.message);
      }
    }
  }
  
  console.log('\n🏁 SNIP-20 Token Query Tests Complete');
}

testSNIP20Queries();