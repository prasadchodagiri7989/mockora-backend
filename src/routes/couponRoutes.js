const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// All coupon management routes require Admin authorization
router.use(verifyToken, requireAdmin);

router.get('/', couponController.getAllCoupons);
router.post('/', couponController.createCoupon);
router.put('/:id', couponController.updateCoupon);
router.patch('/:id/toggle', couponController.toggleCouponStatus);
router.delete('/:id', couponController.deleteCoupon);

module.exports = router;
