const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  currency: {
    type: String,
    default: 'KES',
    enum: ['KES', 'UGX', 'TZS', 'NGN', 'ZMW']
  },
  type: {
    type: String,
    enum: ['send', 'receive', 'deposit', 'withdrawal', 'refund', 'fee'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'REVERSED'],
    default: 'PENDING',
    required: true,
    index: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  reference: {
    type: String,
    default: null
  },
  provider: {
    type: String,
    enum: ['SYSTEM', 'MPESA', 'AIRTEL'],
    required: [true, 'Provider is required'],
    index: true
  },
  providerTransactionId: {
    type: String,
    default: null,
    sparse: true,
    index: true
  },
  fee: {
    type: Number,
    default: 0,
    min: [0, 'Fee cannot be negative']
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    validate: {
      validator: function(v) {
        const size = Buffer.byteLength(JSON.stringify(v));
        return size <= 16384; // 16KB max for webhook payload storage
      },
      message: 'Metadata payload exceeds 16KB limit'
    }
  }
}, {
  timestamps: true
});

// Compound indexes for performance
transactionSchema.index({ sender: 1, createdAt: -1 });
transactionSchema.index({ receiver: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ provider: 1, status: 1 });
transactionSchema.index({ providerTransactionId: 1, provider: 1 });

// Prevent duplicate provider transaction IDs at application level
transactionSchema.index(
  { providerTransactionId: 1 },
  { 
    unique: true, 
    sparse: true,
    partialFilterExpression: { providerTransactionId: { $type: 'string' } }
  }
);

// Pre-save hook to enforce state machine logic
transactionSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    const validTransitions = {
      'PENDING': ['SUCCESS', 'FAILED'],
      'SUCCESS': ['REVERSED'],
      'FAILED': [],
      'REVERSED': []
    };
    
    const previousStatus = this.$locals.previousStatus || 'PENDING';
    const allowed = validTransitions[previousStatus] || [];
    
    if (!allowed.includes(this.status) && previousStatus !== this.status) {
      return next(new Error(`Invalid status transition: ${previousStatus} -> ${this.status}`));
    }
  }
  next();
});

// Store previous status before modification
transactionSchema.pre('findOneAndUpdate', function(next) {
  this._update.$locals = this._update.$locals || {};
  next();
});

// Instance method for safe status updates
transactionSchema.methods.updateStatus = async function(newStatus, metadataUpdate = {}) {
  const validTransitions = {
    'PENDING': ['SUCCESS', 'FAILED'],
    'SUCCESS': ['REVERSED'],
    'FAILED': [],
    'REVERSED': []
  };
  
  const allowed = validTransitions[this.status] || [];
  if (!allowed.includes(newStatus) && this.status !== newStatus) {
    throw new Error(`Invalid status transition: ${this.status} -> ${newStatus}`);
  }
  
  this.status = newStatus;
  if (Object.keys(metadataUpdate).length > 0) {
    this.metadata = { ...this.metadata, ...metadataUpdate, updatedAt: new Date() };
  }
  
  return this.save();
};

module.exports = mongoose.model('Transaction', transactionSchema);