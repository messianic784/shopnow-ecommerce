const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

// ─── Products ───────────────────────────────────────────────────────────────

// GET /api/admin/products
const getAdminProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search ? { $text: { $search: req.query.search } } : {};

    const [total, products] = await Promise.all([
      Product.countDocuments(search),
      Product.find(search).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-reviews')
    ]);

    res.json({ success: true, products, total, totalPages: Math.ceil(total / limit), currentPage: page });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/products
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, originalPrice, category, brand, stock, featured, tags } = req.body;

    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(f => `/uploads/${f.filename}`);
    } else if (req.body.images) {
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      originalPrice: Number(originalPrice) || 0,
      category,
      brand: brand || '',
      stock: Number(stock),
      featured: featured === 'true' || featured === true,
      images,
      tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : tags) : []
    });

    res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const fields = ['name', 'description', 'category', 'brand'];
    fields.forEach(f => { if (req.body[f] !== undefined) product[f] = req.body[f]; });

    if (req.body.price !== undefined) product.price = Number(req.body.price);
    if (req.body.originalPrice !== undefined) product.originalPrice = Number(req.body.originalPrice);
    if (req.body.stock !== undefined) product.stock = Number(req.body.stock);
    if (req.body.featured !== undefined) product.featured = req.body.featured === 'true' || req.body.featured === true;
    if (req.body.isActive !== undefined) product.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    if (req.body.tags) {
      product.tags = typeof req.body.tags === 'string' ? req.body.tags.split(',').map(t => t.trim()).filter(Boolean) : req.body.tags;
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => `/uploads/${f.filename}`);
      product.images = [...product.images, ...newImages];
    }

    await product.save();
    res.json({ success: true, message: 'Product updated successfully', product });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── Users ───────────────────────────────────────────────────────────────────

// GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      User.countDocuments(),
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit).select('-wishlist')
    ]);

    res.json({ success: true, users, total, totalPages: Math.ceil(total / limit), currentPage: page });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/users/:id
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();
    res.json({ success: true, message: 'User updated successfully', user });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── Orders ──────────────────────────────────────────────────────────────────

// GET /api/admin/orders
const getOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.orderStatus = req.query.status;

    const [total, orders] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name email')
    ]);

    res.json({ success: true, orders, total, totalPages: Math.ceil(total / limit), currentPage: page });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/orders/:id
const updateOrder = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.orderStatus = orderStatus;
    if (orderStatus === 'Delivered') order.deliveredAt = Date.now();
    if (orderStatus === 'Processing' && !order.isPaid) {
      order.isPaid = true;
      order.paidAt = Date.now();
    }

    await order.save();
    res.json({ success: true, message: 'Order updated successfully', order });
  } catch (error) {
    next(error);
  }
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

// GET /api/admin/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers, totalProducts, totalOrders, revenueResult, ordersByStatus, recentOrders, topProducts, monthlySales] =
      await Promise.all([
        User.countDocuments({ role: 'user' }),
        Product.countDocuments({ isActive: true }),
        Order.countDocuments(),
        Order.aggregate([{ $match: { isPaid: true } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
        Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
        Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
        Order.aggregate([
          { $unwind: '$orderItems' },
          { $group: { _id: '$orderItems.name', totalSold: { $sum: '$orderItems.quantity' }, revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } } } },
          { $sort: { totalSold: -1 } },
          { $limit: 5 }
        ]),
        Order.aggregate([
          { $match: { isPaid: true, createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } } },
          { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, sales: { $sum: '$totalPrice' }, orders: { $sum: 1 } } },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ])
      ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: revenueResult[0]?.total || 0,
        ordersByStatus,
        recentOrders,
        topProducts,
        monthlySales
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminProducts, createProduct, updateProduct, deleteProduct,
  getUsers, updateUser, deleteUser,
  getOrders, updateOrder,
  getDashboardStats
};
