#!/usr/bin/env node

/**
 * Test script for secret_send_tokens MCP tool
 * Tests that the tool is registered and can be called
 */

const axios = require('axios');

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8002';

async function testSendTokensTool() {
  console.log('Testing secret_send_tokens tool...\n');
  
  try {
    // Step 1: Check health
    console.log('1. Checking MCP server health...');
    const healthResponse = await axios.get(`${MCP_SERVER_URL}/api/health`);
    console.log('✓ Server is healthy:', healthResponse.data);
    console.log();
    
    // Step 2: List tools and verify secret_send_tokens exists
    console.log('2. Checking if secret_send_tokens tool is registered...');
    const toolsResponse = await axios.get(`${MCP_SERVER_URL}/api/mcp/tools/list`);
    const tools = toolsResponse.data.tools || [];
    
    const sendTokensTool = tools.find(tool => tool.name === 'secret_send_tokens');
    if (sendTokensTool) {
      console.log('✓ secret_send_tokens tool found!');
      console.log('Tool details:', JSON.stringify(sendTokensTool, null, 2));
    } else {
      console.log('✗ secret_send_tokens tool NOT found');
      console.log('Available tools:', tools.map(t => t.name).join(', '));
      process.exit(1);
    }
    console.log();
    
    // Step 3: Test tool execution with sample data
    console.log('3. Testing secret_send_tokens tool execution...');
    const testRequest = {
      name: 'secret_send_tokens',
      arguments: {
        from_address: 'secret1test1234567890123456789012345678901234567',
        to_address: 'secret1dest1234567890123456789012345678901234567',
        amount: '1.5',
        memo: 'Test transaction'
      }
    };
    
    console.log('Request:', JSON.stringify(testRequest, null, 2));
    
    const executeResponse = await axios.post(
      `${MCP_SERVER_URL}/api/mcp/tools/call`,
      testRequest,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('✓ Tool executed successfully!');
    console.log('Response:', JSON.stringify(executeResponse.data, null, 2));
    
    // Check if response indicates Keplr signing is required
    if (executeResponse.data.result?.requiresKeplrSigning) {
      console.log('\n✓ Tool correctly indicates Keplr signing is required');
      console.log('Transaction data:', executeResponse.data.result.transactionData);
    }
    
    console.log('\n✅ All tests passed! secret_send_tokens tool is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed!');
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Status:', error.response.status);
    } else if (error.request) {
      console.error('No response received. Is the MCP server running?');
      console.error('Try starting it with: npm start');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

// Run the test
console.log(`Testing MCP server at: ${MCP_SERVER_URL}`);
console.log('=' .repeat(50));
testSendTokensTool();