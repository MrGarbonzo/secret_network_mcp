const axios = require('axios');

const BASE_URL = 'http://localhost:8002';

async function testWalletEndpoints() {
  console.log('🧪 Testing Secret Network MCP Wallet Endpoints...\n');

  // Test wallet status endpoint
  console.log('1. Testing GET /api/wallet/status');
  try {
    const statusResponse = await axios.get(`${BASE_URL}/api/wallet/status`);
    console.log('✅ Wallet status:', statusResponse.data);
  } catch (error) {
    console.error('❌ Wallet status error:', error.response?.data || error.message);
  }

  // Test wallet connection
  console.log('\n2. Testing POST /api/wallet/connect');
  const testAddress = 'secret1test1234567890abcdefghijklmnopqrstuvwxyz'; // 45 chars
  try {
    const connectResponse = await axios.post(`${BASE_URL}/api/wallet/connect`, {
      address: testAddress,
      name: 'Test Wallet',
      isHardwareWallet: false
    });
    console.log('✅ Wallet connect response:', connectResponse.data);
  } catch (error) {
    console.error('❌ Wallet connect error:', error.response?.data || error.message);
  }

  // Test balance query (will fail with test address)
  console.log('\n3. Testing GET /api/wallet/balance/:address');
  try {
    const balanceResponse = await axios.get(`${BASE_URL}/api/wallet/balance/${testAddress}`);
    console.log('✅ Balance response:', balanceResponse.data);
  } catch (error) {
    console.error('❌ Balance query error:', error.response?.data || error.message);
  }

  // Test wallet info
  console.log('\n4. Testing GET /api/wallet/info/:address');
  try {
    const infoResponse = await axios.get(`${BASE_URL}/api/wallet/info/${testAddress}`);
    console.log('✅ Wallet info:', infoResponse.data);
  } catch (error) {
    console.error('❌ Wallet info error:', error.response?.data || error.message);
  }

  // Test transaction status (will fail with fake hash)
  console.log('\n5. Testing GET /api/wallet/transaction/:txHash');
  const fakeHash = 'A'.repeat(64);
  try {
    const txResponse = await axios.get(`${BASE_URL}/api/wallet/transaction/${fakeHash}`);
    console.log('✅ Transaction status:', txResponse.data);
  } catch (error) {
    console.error('❌ Transaction status error:', error.response?.data || error.message);
  }

  // Test disconnect wallet
  console.log('\n6. Testing DELETE /api/wallet/disconnect/:address');
  try {
    const disconnectResponse = await axios.delete(`${BASE_URL}/api/wallet/disconnect/${testAddress}`);
    console.log('✅ Wallet disconnect:', disconnectResponse.data);
  } catch (error) {
    console.error('❌ Wallet disconnect error:', error.response?.data || error.message);
  }

  console.log('\n✅ Wallet endpoint tests completed!');
}

// Run tests
testWalletEndpoints().catch(console.error);