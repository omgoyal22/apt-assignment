require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/database');
const Order = require('./models/Order');
const orderRoutes = require('./routes/orders');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/api/orders', orderRoutes);

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  Order.find().sort({ updated_at: -1 }).limit(10)
    .then(orders => {
      socket.emit('initial_orders', orders);
    })
    .catch(err => {
      console.error('Error fetching initial orders:', err);
    });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

const setupChangeStreams = () => {
  try {
    const changeStream = Order.watch([], { 
      fullDocument: 'updateLookup',
      fullDocumentBeforeChange: 'whenAvailable'
    });

    changeStream.on('change', (change) => {
      console.log('📊 Database change detected:', change.operationType);
      
      let notification = {
        operation: change.operationType,
        timestamp: new Date().toISOString(),
        data: null
      };

      try {
        switch (change.operationType) {
          case 'insert':
            notification.data = change.fullDocument;
            break;
          case 'update':
            notification.data = change.fullDocument;
            notification.previousData = change.fullDocumentBeforeChange;
            break;
          case 'delete':
            notification.data = change.documentKey;
            break;
          case 'replace':
            notification.data = change.fullDocument;
            break;
          default:
            console.log('⚠️ Unknown operation type:', change.operationType);
            return;
        }

        // Broadcast to all connected clients
        io.emit('order_update', notification);
        console.log(`📡 Update broadcasted to ${io.engine.clientsCount} clients`);
      } catch (error) {
        console.error('❌ Error processing change stream event:', error);
      }
    });

    changeStream.on('error', (error) => {
      console.error('❌ Change stream error:', error);
      // Attempt to restart change stream after a delay
      setTimeout(() => {
        console.log('🔄 Attempting to restart change stream...');
        setupChangeStreams();
      }, 5000);
    });

    changeStream.on('close', () => {
      console.log('⚠️ Change stream closed, attempting to reconnect...');
      setTimeout(() => {
        setupChangeStreams();
      }, 2000);
    });

    console.log('👂 Change stream initialized for real-time updates');
  } catch (error) {
    console.error('❌ Failed to setup change stream:', error);
    // Retry after delay
    setTimeout(() => {
      console.log('🔄 Retrying change stream setup...');
      setupChangeStreams();
    }, 5000);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    setupChangeStreams();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Web interface: http://localhost:${PORT}`);
      console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close();
    process.exit(0);
  });
});

startServer();
