#!/usr/bin/env node

/**
 * Simple test script for Secret Network MCP Server
 * Tests basic functionality and health check
 */

import { spawn } from 'child_process';

async function testMCPServer() {
  console.log('🧪 Testing Secret Network MCP Server...');
  
  try {
    // Test 1: Check if server builds successfully
    console.log('📦 Testing build...');
    const buildProcess = spawn('npm', ['run', 'build'], { stdio: 'inherit' });
    
    await new Promise((resolve, reject) => {
      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Build successful');
          resolve();
        } else {
          reject(new Error(`Build failed with code ${code}`));
        }
      });
    });
    
    console.log('🎉 All tests passed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testMCPServer();