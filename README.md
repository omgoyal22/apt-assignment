# Real-Time Order Management System

A simple order tracking system that updates everyone instantly when orders change. Perfect for e-commerce, inventory management, or any business that needs live order updates.

## What This Does

- See order changes instantly across all devices
- Manage orders through a web interface or command line
- Get real-time statistics and notifications
- Works with MongoDB to track everything automatically

## Quick Start

### What You Need
- Node.js (download from nodejs.org)
- MongoDB (use free MongoDB Atlas or install locally)

### Get It Running

1. **Download and setup**
```bash
git clone https://github.com/omgoyal22/apt-assignment.git
cd algo_trading
npm install
```

2. **Configure database**
Create a `.env` file:
```
MONGODB_URI=""
PORT=3000
```

3. **Add some sample data**
```bash
npm run seed
```

4. **Start the server**
```bash
npm start
```

5. **Open your browser**
Go to `http://localhost:3000` and start creating orders!

## How to Use

### Web Interface (Easiest Way)
1. Open `http://localhost:3000` in your browser
2. Fill out the form to create orders
3. Watch orders update in real-time as you change them
4. Open multiple browser tabs to see live sync between them

### Command Line Interface
```bash
node client.js
```
Then follow the menu:
- **1** - See all orders
- **2** - Create a new order  
- **3** - Update order status
- **4** - Delete an order
- **5** - View statistics
- **6** - Exit

### Available Commands

**Test everything works:**
```bash
npm run test
```

**Add sample data:**
```bash
npm run seed
```

**Start the CLI client:**
```bash
node client.js
```

## API Reference

If you want to build your own client, here are the endpoints:

**Get all orders:**
```bash
GET /api/orders
```

**Create order:**
```bash
POST /api/orders
{
  "customer_name": "John Doe",
  "product_name": "Laptop", 
  "status": "pending"
}
```

**Update order status:**
```bash
PATCH /api/orders/{id}/status
{
  "status": "shipped"
}
```

**Delete order:**
```bash
DELETE /api/orders/{id}
```

**Get statistics:**
```bash
GET /api/orders/stats/summary
```

## What's Inside

This project has a few key files:
- `server.js` - Main server that handles everything
- `client.js` - Command line interface
- `public/index.html` - Web interface
- `routes/orders.js` - API endpoints
- `models/Order.js` - Database structure

## Troubleshooting

**Server won't start?**
- Make sure MongoDB is running
- Check your `.env` file has the right database URL
- Try `npm install` again

**No real-time updates?**
- Refresh your browser
- Check the server terminal for error messages
- Make sure you're using a modern browser

**Can't connect to database?**
- If using local MongoDB: run `mongod` first
- If using MongoDB Atlas: double-check your connection string
- Make sure your IP is whitelisted in MongoDB Atlas

## Using MongoDB Atlas (Recommended)

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a free account and cluster
3. Get your connection string
4. Update your `.env` file:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/realtime_orders
```

## Project Structure

```
algo_trading/
├── server.js          # Main server
├── client.js          # CLI interface  
├── package.json       # Dependencies
├── .env              # Your config
├── public/           # Web interface
├── routes/           # API routes
├── models/           # Database models
├── config/           # Database setup
└── scripts/          # Helper scripts
```

That's it! You now have a working real-time order system. Perfect for learning WebSockets, MongoDB, or building your own order management system.
