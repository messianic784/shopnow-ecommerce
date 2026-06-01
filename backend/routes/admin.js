const express = require('express');
const {
  getAdminProducts, createProduct, updateProduct, deleteProduct,
  getUsers, updateUser, deleteUser,
  getOrders, updateOrder,
  getDashboardStats
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect, admin);

router.get('/stats', getDashboardStats);

router.get('/products', getAdminProducts);
router.post('/products', upload.array('images', 5), createProduct);
router.put('/products/:id', upload.array('images', 5), updateProduct);
router.delete('/products/:id', deleteProduct);

router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/orders', getOrders);
router.put('/orders/:id', updateOrder);

module.exports = router;
