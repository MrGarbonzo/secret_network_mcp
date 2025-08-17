#!/usr/bin/env node

/**
 * Test script for Secret Network MCP NFT contract queries
 * Tests the secret_query_contract functionality for SNIP-721 NFT contracts
 */

const fetch = require('node-fetch');

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8002';

async function testNFTContractQuery() {
  console.log('🧪 Testing Secret Network MCP NFT Contract Queries');
  console.log('=' + '='.repeat(55));
  
  // Test configuration
  const testCases = [
    {
      name: 'SNIP-721 Tokens Query (Jack Robbins Collection)',
      contractAddress: 'secret10xgnqk9rfggdemk9qlfsvw4lkc4ph2sjhr7eav',
      query: {
        tokens: {
          owner: 'secret1example1234567890abcdefghijklmnopqrstuv',
          limit: 10
        }
      },
      expectedResult: 'Should return empty tokens array for non-owner'
    },
    {
      name: 'Contract Info Query',
      contractAddress: 'secret10xgnqk9rfggdemk9qlfsvw4lkc4ph2sjhr7eav',
      query: {
        contract_info: {}
      },
      expectedResult: 'Should return contract metadata'
    },
    {
      name: 'Num Tokens Query',
      contractAddress: 'secret10xgnqk9rfggdemk9qlfsvw4lkc4ph2sjhr7eav',
      query: {
        num_tokens: {}
      },
      expectedResult: 'Should return total number of tokens'
    }
  ];

  console.log(`📡 Testing MCP server at: ${MCP_SERVER_URL}`);
  
  // Test server health first
  await testServerHealth();
  
  // Test available tools
  await testAvailableTools();
  
  // Test contract queries
  for (const [index, testCase] of testCases.entries()) {
    console.log(`\n📋 Test ${index + 1}: ${testCase.name}`);
    console.log(`   Contract: ${testCase.contractAddress}`);
    console.log(`   Query: ${JSON.stringify(testCase.query, null, 2)}`);
    console.log(`   Expected: ${testCase.expectedResult}`);
    
    try {
      const result = await callMCPTool('secret_query_contract', {
        contractAddress: testCase.contractAddress,
        query: testCase.query
      });
      
      console.log(`   ✅ Query successful`);
      console.log(`   📄 Result: ${JSON.stringify(result, null, 2)}`);
      
    } catch (error) {
      console.log(`   ❌ Query failed: ${error.message}`);
    }
  }
  
  console.log('\n🏁 NFT Contract Query Tests Complete');
}

async function testServerHealth() {
  console.log('\n🏥 Testing MCP Server Health...');
  
  try {
    const response = await fetch(`${MCP_SERVER_URL}/api/health`);
    const health = await response.json();
    
    console.log(`   📨 Status: ${response.status}`);
    console.log(`   📄 Health: ${JSON.stringify(health, null, 2)}`);
    
    if (response.status === 200 && health.status === 'healthy') {
      console.log('   ✅ MCP server is healthy');
      return true;
    } else {
      console.log('   ❌ MCP server health check failed');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Health check error: ${error.message}`);
    return false;
  }
}

async function testAvailableTools() {
  console.log('\n🔧 Testing Available Tools...');
  
  try {
    const response = await fetch(`${MCP_SERVER_URL}/api/mcp/tools/list`);
    const toolsData = await response.json();
    
    console.log(`   📨 Status: ${response.status}`);
    console.log(`   🔧 Tools available: ${toolsData.tools?.length || 0}`);
    
    // Check if secret_query_contract is available
    const queryContractTool = toolsData.tools?.find(tool => tool.name === 'secret_query_contract');
    if (queryContractTool) {
      console.log('   ✅ secret_query_contract tool is available');
      console.log(`   📋 Tool schema: ${JSON.stringify(queryContractTool.inputSchema, null, 2)}`);
    } else {
      console.log('   ❌ secret_query_contract tool not found');
      console.log(`   Available tools: ${toolsData.tools?.map(t => t.name).join(', ') || 'none'}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Tools list error: ${error.message}`);
  }
}

async function callMCPTool(toolName, args) {
  const response = await fetch(`${MCP_SERVER_URL}/api/mcp/tools/call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: toolName,
      arguments: args
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.error?.message || 'Unknown error'}`);
  }
  
  if (!data.success) {
    throw new Error(`Tool execution failed: ${data.error?.message || 'Unknown error'}`);
  }
  
  return data.result;
}

// Run the test
if (require.main === module) {
  testNFTContractQuery().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testNFTContractQuery };