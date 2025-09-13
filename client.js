require('dotenv').config();
const axios = require('axios');
const io = require('socket.io-client');
const readline = require('readline');

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/orders`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

let socket;

function connectWebSocket() {
  socket = io(BASE_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 20000
  });
  socket.on('connect', () => {
    console.log(colorize('Connected to real-time updates', 'green'));
  });
  socket.on('disconnect', () => {
    console.log(colorize('Disconnected from real-time updates', 'red'));
  });
  socket.on('order_update', (data) => {
    console.log(colorize(`Real-time Update: ${data.message}`, 'cyan'));
    if (data.order) {
      console.log(`   Order: ${data.order.customer_name} - ${data.order.product_name} (${data.order.status})`);
    }
    showPrompt();
  });
  socket.on('connect_error', (error) => {
    console.log(colorize(`Connection error: ${error.message}`, 'red'));
  });
}

async function createOrder() {
  try {
    const customer_name = await askQuestion('Enter customer name: ');
    const product_name = await askQuestion('Enter product name: ');
    const status = await askQuestion('Enter status (pending/shipped/delivered) [pending]: ') || 'pending';
    const response = await axios.post(API_URL, {
      customer_name,
      product_name,
      status
    });
    if (response.data.success) {
      console.log(colorize('Order created successfully!', 'green'));
      console.log(`Order ID: ${response.data.data._id}`);
    }
  } catch (error) {
    console.log(colorize(`Error creating order: ${error.response?.data?.message || error.message}`, 'red'));
  }
}

async function updateOrder() {
  try {
    const orderId = await askQuestion('Enter order ID to update: ');
    const status = await askQuestion('Enter new status (pending/shipped/delivered): ');
    const response = await axios.patch(`${API_URL}/${orderId}/status`, { status });
    if (response.data.success) {
      console.log(colorize('Order updated successfully!', 'green'));
    }
  } catch (error) {
    console.log(colorize(`Error updating order: ${error.response?.data?.message || error.message}`, 'red'));
  }
}

async function deleteOrder() {
  try {
    const orderId = await askQuestion('Enter order ID to delete: ');
    const response = await axios.delete(`${API_URL}/${orderId}`);
    if (response.data.success) {
      console.log(colorize('Order deleted successfully!', 'green'));
    }
  } catch (error) {
    console.log(colorize(`Error deleting order: ${error.response?.data?.message || error.message}`, 'red'));
  }
}

async function getAllOrders() {
  try {
    const response = await axios.get(API_URL);
    const orders = response.data.data;
    if (orders.length === 0) {
      console.log(colorize('No orders found', 'yellow'));
      return;
    }
    console.log(colorize('\nAll Orders:', 'bright'));
    console.log('=' .repeat(80));
    orders.forEach((order, index) => {
      const statusColor = order.status === 'delivered' ? 'green' : 
                         order.status === 'shipped' ? 'yellow' : 'cyan';
      console.log(`${index + 1}. ID: ${order._id}`);
      console.log(`   Customer: ${order.customer_name}`);
      console.log(`   Product: ${order.product_name}`);
      console.log(`   Status: ${colorize(order.status.toUpperCase(), statusColor)}`);
      console.log(`   Created: ${new Date(order.createdAt).toLocaleString()}`);
      console.log(`   Updated: ${new Date(order.updatedAt).toLocaleString()}`);
      console.log('-' .repeat(80));
    });
  } catch (error) {
    console.log(colorize(`Error fetching orders: ${error.message}`, 'red'));
  }
}

async function getOrderStats() {
  try {
    const response = await axios.get(`${API_URL}/stats/summary`);
    const stats = response.data.data;
    console.log(colorize('\nOrder Statistics:', 'bright'));
    console.log('=' .repeat(40));
    console.log(`Total Orders: ${stats.total}`);
    console.log(`Pending: ${colorize(stats.pending, 'cyan')}`);
    console.log(`Shipped: ${colorize(stats.shipped, 'yellow')}`);
    console.log(`Delivered: ${colorize(stats.delivered, 'green')}`);
  } catch (error) {
    console.log(colorize(`Error fetching stats: ${error.message}`, 'red'));
  }
}

function showMenu() {
  console.log(colorize('\nReal-time Order Management CLI', 'bright'));
  console.log('=' .repeat(50));
  console.log('1. View all orders');
  console.log('2. Create new order');
  console.log('3. Update order status');
  console.log('4. Delete order');
  console.log('5. View order statistics');
  console.log('6. Exit');
  console.log('=' .repeat(50));
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function handleUserChoice(choice) {
  switch (choice.trim()) {
    case '1':
      await getAllOrders();
      break;
    case '2':
      await createOrder();
      break;
    case '3':
      await updateOrder();
      break;
    case '4':
      await deleteOrder();
      break;
    case '5':
      await getOrderStats();
      break;
    case '6':
      console.log(colorize('Goodbye!', 'cyan'));
      if (socket) socket.disconnect();
      rl.close();
      process.exit(0);
      break;
    default:
      console.log(colorize('Invalid choice. Please enter 1-6.', 'red'));
  }
  showPrompt();
}

function showPrompt() {
  rl.question('\nEnter your choice (1-6): ', handleUserChoice);
}

async function init() {
  console.log(colorize('Starting Order Management CLI...', 'bright'));
  try {
    await axios.get(`${API_URL}/stats/summary`, { timeout: 5000 });
    console.log(colorize('Connected to server', 'green'));
    connectWebSocket();
    showMenu();
    showPrompt();
  } catch (error) {
    console.log(colorize('Failed to connect to server. Please make sure the server is running.', 'red'));
    console.log(colorize(`Error: ${error.message}`, 'red'));
    process.exit(1);
  }
}

init();
