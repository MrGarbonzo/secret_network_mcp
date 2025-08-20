#!/usr/bin/env node

const { SecretNetworkClient } = require('secretjs');

async function testCodeHash() {
  const secretClient = new SecretNetworkClient({
    url: 'https://rpc.ankr.com/http/scrt_cosmos',
    chainId: 'secret-4',
  });

  const contractAddress = 'secret10xgnqk9rfggdemk9qlfsvw4lkc4ph2sjhr7eav';
  
  try {
    console.log('1. Getting contract info for:', contractAddress);
    const contractInfo = await secretClient.query.compute.contractInfo({
      contract_address: contractAddress
    });
    console.log('Contract info:', JSON.stringify(contractInfo, null, 2));
    
    // Try different property names
    const codeId = contractInfo.ContractInfo?.code_id || 
                   contractInfo.contract_info?.code_id || 
                   contractInfo.code_id ||
                   contractInfo.codeId;
    
    console.log('\n2. Code ID found:', codeId);
    
    if (codeId) {
      console.log('\n3. Getting code info for code ID:', codeId);
      const codeIdNum = parseInt(codeId, 10);
      console.log('   Using numeric code ID:', codeIdNum);
      const codeInfo = await secretClient.query.compute.code(codeIdNum);
      console.log('Code info:', JSON.stringify(codeInfo, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testCodeHash();