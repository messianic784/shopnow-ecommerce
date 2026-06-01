const express = require('express');
const { createOrder, getMyOrders, getOrder, updateOrderToPaid } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createOrder);
router.get('/myorders', getMyOrders);
router.get('/:id', getOrder);
router.put('/:id/pay', updateOrderToPaid);

module.exports = router;
