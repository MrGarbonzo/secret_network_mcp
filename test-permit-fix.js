#!/usr/bin/env node

/**
 * Test script to verify permit structure fixes for SHD token
 */

const fetch = require('node-fetch');

async function testPermitWithSHD() {
  const API_URL = 'http://localhost:8002';
  
  // Test permit with the new structure (chain_id in params)
  const testPermit = {
    params: {
      permit_name: "secretGPT-master",
      allowed_tokens: [
        "secret153wu605vvp934xhd4k9dtd640zsep5jkesstdm", // SHD
        "secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek", // sSCRT
        // Add other tokens as needed
      ],
      permissions: ["balance"],
      chain_id: "secret-4"  // Now correctly in params
    },
    signature: {
      pub_key: {
        type: "tendermint/PubKeySecp256k1",
        value: "Azn0Wwza5BPGF+P5XsMtzfeEUtPQCGeFBdxUQbLtxETt"
      },
      signature: "o+eaW1v1oC+2n4k/PNbHO/D69nKG1KqarWrXGg7gWXZjeIazxkBwrW0kH1EfnwYxCQMj1oNdXS2OlYtfXEWwKA=="
    }
  };
  
  const requestBody = {
    name: "secret_query_token_balance",
    arguments: {
      tokenSymbolOrName: "SHD",
      address: "secret16dmvh2rg9n9zlql6k87ls3pr5g9qcg5agpmpzl",
      permit: testPermit
    }
  };
  
  console.log('🔍 Testing SHD balance query with fixed permit structure...\n');
  console.log('📝 Request body:', JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await fetch(`${API_URL}/api/mcp/tools/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const result = await response.json();
    
    console.log('\n📊 Response:', JSON.stringify(result, null, 2));
    
    if (result.content && result.content[0]) {
      const text = result.content[0].text;
      console.log('\n✅ Result:', text);
      
      // Check if we got a real balance or still getting the error
      if (text.includes('0.000000 SHD')) {
        console.log('\n⚠️  Still getting 0 balance - permit may still have issues');
        console.log('Check server logs for detailed permit validation output');
      } else if (text.includes('error') || text.includes('failed')) {
        console.log('\n❌ Error in response - check server logs');
      } else {
        console.log('\n✅ Success! Permit structure fix appears to be working');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testPermitWithSHD().catch(console.error);