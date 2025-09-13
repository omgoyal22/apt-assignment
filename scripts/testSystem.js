require('dotenv').config();
const axios = require('axios');
const io = require('socket.io-client');

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/orders`;

const TEST_CONFIG = {
  timeout: 5000,
  maxRetries: 3
};

let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

// Test functions
async function testAPI() {
    console.log(colorize('\n🧪 Testing REST API...', 'bright'));
    
    try {
        // Test server health
        const healthResponse = await axios.get(`${API_URL}/stats/summary`, { timeout: TEST_CONFIG.timeout });
        console.log(colorize('✅ Server is running', 'green'));
        
        // Test creating an order
        const createResponse = await axios.post(API_URL, {
            customer_name: 'Test Customer',
            product_name: 'Test Product',
            status: 'pending'
        }, { timeout: TEST_CONFIG.timeout });
        
        if (createResponse.data.success) {
            console.log(colorize('✅ Order creation works', 'green'));
            const orderId = createResponse.data.data._id;
            
            // Test updating order
            const updateResponse = await axios.patch(`${API_URL}/${orderId}/status`, {
                status: 'shipped'
            }, { timeout: TEST_CONFIG.timeout });
            
            if (updateResponse.data.success) {
                console.log(colorize('✅ Order update works', 'green'));
            }
            
            // Test deleting order
            const deleteResponse = await axios.delete(`${API_URL}/${orderId}`, { timeout: TEST_CONFIG.timeout });
            
            if (deleteResponse.data.success) {
                console.log(colorize('✅ Order deletion works', 'green'));
            }
            
            // Test getting all orders
            const testGetAllOrders = async () => {
                const response = await axios.get(API_URL, { timeout: TEST_CONFIG.timeout });
                if (response.status !== 200) {
                    throw new Error(`Expected status 200, got ${response.status}`);
                }
                if (!Array.isArray(response.data.data)) {
                    throw new Error('Expected orders array in response.data.data');
                }
            };
            
            // Test server connection
            const testServerConnection = async () => {
                const response = await axios.get(BASE_URL, { timeout: TEST_CONFIG.timeout });
                if (response.status !== 200) {
                    throw new Error(`Expected status 200, got ${response.status}`);
                }
            };
            
            await testGetAllOrders();
            await testServerConnection();
        }
        
    } catch (error) {
        console.log(colorize(`❌ API test failed: ${error.message}`, 'red'));
        return false;
    }
    
    return true;
}

function testWebSocket() {
    return new Promise((resolve) => {
        console.log(colorize('\n🔌 Testing WebSocket connection...', 'bright'));
        
        const testWebSocketUpdates = async () => {
            return new Promise((resolve, reject) => {
                const socket = io(BASE_URL, {
                    timeout: TEST_CONFIG.timeout,
                    forceNew: true
                });
                let updateReceived = false;
                const timeout = setTimeout(() => {
                    socket.disconnect();
                    if (!updateReceived) {
                        reject(new Error('No WebSocket update received within timeout period'));
                    }
                }, TEST_CONFIG.timeout);
                socket.on('order_update', (data) => {
                    updateReceived = true;
                    clearTimeout(timeout);
                    socket.disconnect();
                    if (!data || !data.type) {
                        reject(new Error('Invalid update data received'));
                    } else {
                        resolve();
                    }
                });
                socket.on('connect_error', (error) => {
                    clearTimeout(timeout);
                    socket.disconnect();
                    reject(new Error(`WebSocket connection failed: ${error.message}`));
                });
                setTimeout(async () => {
                    try {
                        const newOrder = {
                            customer_name: 'WebSocket Test Customer',
                            product_name: 'WebSocket Test Product',
                            status: 'pending'
                        };
                        await axios.post(API_URL, newOrder, { timeout: TEST_CONFIG.timeout });
                    } catch (error) {
                        clearTimeout(timeout);
                        socket.disconnect();
                        reject(new Error(`Failed to create test order: ${error.message}`));
                    }
                }, 1000);
            });
        };
        
        testWebSocketUpdates().then(() => {
            console.log(colorize('✅ WebSocket updates working', 'green'));
            resolve(true);
        }).catch((error) => {
            console.log(colorize(`❌ WebSocket test failed: ${error.message}`, 'red'));
            resolve(false);
        });
    });
}

async function runTests() {
    console.log(colorize('🚀 Starting System Tests', 'bright'));
    console.log(colorize('=' .repeat(50), 'cyan'));
    
    const runTest = async (testName, testFunction) => {
        testResults.total++;
        console.log(`\n🧪 Running: ${testName}`);
        try {
            await testFunction();
            testResults.passed++;
            console.log(`✅ PASSED: ${testName}`);
        } catch (error) {
            testResults.failed++;
            console.log(`❌ FAILED: ${testName}`);
            console.log(`   Error: ${error.message}`);
        }
    };
    
    await runTest('API Test', testAPI);
    await runTest('WebSocket Test', testWebSocket);
    
    console.log(colorize('\n📊 Test Results:', 'bright'));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed Tests: ${testResults.passed}`);
    console.log(`Failed Tests: ${testResults.failed}`);
    
    if (testResults.passed === testResults.total) {
        console.log(colorize('\n🎉 All tests passed! System is working correctly.', 'green'));
    } else {
        console.log(colorize('\n❌ Some tests failed. Please check the server logs.', 'red'));
    }
    
    process.exit(0);
}

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

runTests();
