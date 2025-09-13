const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer_name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    minlength: [2, 'Customer name must be at least 2 characters long'],
    maxlength: [100, 'Customer name cannot exceed 100 characters'],
    validate: {
      validator: function(v) {
        return /^[a-zA-Z\s'-]+$/.test(v);
      },
      message: 'Customer name can only contain letters, spaces, hyphens, and apostrophes'
    }
  },
  product_name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [2, 'Product name must be at least 2 characters long'],
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'shipped', 'delivered'],
      message: 'Status must be one of: pending, shipped, delivered'
    },
    default: 'pending'
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
});

// Update the updated_at field before saving
orderSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Update the updated_at field before updating
orderSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_at: new Date() });
  next();
});

// Instance method to get formatted order info
orderSchema.methods.getFormattedInfo = function() {
  return {
    id: this._id,
    customer: this.customer_name,
    product: this.product_name,
    status: this.status.toUpperCase(),
    created: this.createdAt.toLocaleDateString(),
    updated: this.updated_at.toLocaleDateString()
  };
};

// Static method to get orders by status
orderSchema.statics.getByStatus = function(status) {
  return this.find({ status: status }).sort({ updated_at: -1 });
};

// Static method to get order statistics
orderSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        latestUpdate: { $max: '$updated_at' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema);
