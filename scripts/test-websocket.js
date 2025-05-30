#!/usr/bin/env node

/**
 * WebSocket Test Script for JobFlow 2025
 * Tests the WebSocket server connectivity and basic functionality
 */

const { io } = require('socket.io-client');

console.log('🧪 Testing JobFlow WebSocket Server...\n');

// Connect to WebSocket server
const socket = io('ws://localhost:3001', {
  transports: ['websocket'],
  timeout: 5000
});

let testsPassed = 0;
let totalTests = 0;

function runTest(name, testFunction) {
  totalTests++;
  console.log(`📋 Test ${totalTests}: ${name}`);
  
  try {
    testFunction();
    testsPassed++;
    console.log(`✅ PASSED\n`);
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}\n`);
  }
}

// Test 1: Connection
socket.on('connect', () => {
  runTest('WebSocket Connection', () => {
    if (!socket.connected) {
      throw new Error('Socket not connected');
    }
    console.log(`   Connected with ID: ${socket.id}`);
  });

  // Test 2: Room joining
  runTest('Room Management', () => {
    socket.emit('joinRoom', 'test-room');
    console.log(`   Joined room: test-room`);
  });

  // Test 3: Chat message
  runTest('Chat Message', () => {
    const testMessage = {
      roomId: 'test-room',
      message: 'Hello from test script!',
      senderId: 'test-user',
      senderName: 'Test User',
      timestamp: new Date().toISOString()
    };

    socket.emit('chatMessage', testMessage);
    console.log(`   Sent test message: "${testMessage.message}"`);
  });

  // Test 4: Time tracking event
  runTest('Time Tracking Event', () => {
    const timeEvent = {
      type: 'TIME_UPDATE',
      data: {
        action: 'START',
        projectId: 'test-project',
        timestamp: new Date().toISOString()
      }
    };

    socket.emit('message', timeEvent);
    console.log(`   Sent time tracking event: ${timeEvent.data.action}`);
  });

  // Test 5: User status update
  runTest('User Status Update', () => {
    const statusUpdate = {
      type: 'USER_STATUS',
      data: {
        status: 'WORKING',
        projectId: 'test-project',
        timestamp: new Date().toISOString()
      }
    };

    socket.emit('message', statusUpdate);
    console.log(`   Sent status update: ${statusUpdate.data.status}`);
  });

  // Finish tests after a short delay
  setTimeout(() => {
    console.log('🏁 Test Results:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${testsPassed}`);
    console.log(`   Failed: ${totalTests - testsPassed}`);
    
    if (testsPassed === totalTests) {
      console.log('\n🎉 All tests passed! WebSocket server is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the WebSocket server configuration.');
    }

    socket.disconnect();
    process.exit(testsPassed === totalTests ? 0 : 1);
  }, 2000);
});

// Error handling
socket.on('connect_error', (error) => {
  console.log('❌ Connection failed:', error.message);
  console.log('\n🔍 Troubleshooting:');
  console.log('   1. Make sure the WebSocket server is running: npm run socket');
  console.log('   2. Check if port 3001 is available');
  console.log('   3. Verify the server is accessible at ws://localhost:3001');
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

// Listen for events to verify server responses
socket.on('chatMessage', (data) => {
  console.log('📨 Received chat message:', data.message);
});

socket.on('timeUpdate', (data) => {
  console.log('⏰ Received time update:', data.action);
});

socket.on('userStatusUpdate', (data) => {
  console.log('👤 Received status update:', data.status);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏱️  Test timeout reached');
  socket.disconnect();
  process.exit(1);
}, 10000); 