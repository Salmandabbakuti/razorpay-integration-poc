require('dotenv').config();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

module.exports = {
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
};
