const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Retailer' },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      quantity: Number,
      price: Number,
    },
  ],
  totalAmount: Number,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending',
  },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Order', orderSchema);
