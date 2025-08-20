#!/usr/bin/env node

/**
 * Test code hash resolution
 */

const fetch = require('node-fetch');

async function testCodeHashResolution() {
  const contractAddress = 'secret10xgnqk9rfggdemk9qlfsvw4lkc4ph2sjhr7eav';
  
  console.log('Testing code hash resolution for:', contractAddress);
  
  // Test with direct LCD query
  const url = `https://secretnetwork-api.lavenderfive.com/cosmwasm/wasm/v1/contract/${contractAddress}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('Contract Info Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testCodeHashResolution();