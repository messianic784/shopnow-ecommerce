const express = require('express');
const { getProducts, getFeaturedProducts, getCategories, getProduct, createReview } = require('../controllers/productController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/featured', getFeaturedProducts);
router.get('/categories', getCategories);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/:id/reviews', protect, createReview);

module.exports = router;
