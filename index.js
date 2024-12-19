const express = require('express');
const Razorpay = require('razorpay');
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');
const app = express();
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = require('./config');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve static files
app.use(express.static(__dirname + '/public'));

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

app.post("/create-order", async (req, res) => {
  console.log("creating order", req.body);
  const { amount, currency } = req.body;
  const options = {
    amount: amount * 100, // amount in the smallest currency unit
    currency,
    receipt: "order_rcptid_11",
    // custom metadata object from request auth token or database
    notes: {
      userId: "123",
      plan: "basic",
      email: "johndoe@gmail.com"
    }
  };
  try {
    const response = await razorpay.orders.create(options);
    res.status(200).send(response);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

app.post("/verify-payment", async (req, res) => {
  console.log("verifying payment webhook", req.body);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  try {
    const isValidSignature = validateWebhookSignature(body, razorpay_signature, RAZORPAY_KEY_SECRET);
    if (isValidSignature) {
      // Update the order with payment details in your database
      console.log("Payment verification successful");
      res.status(200).json({ status: 'ok' });
    } else {
      console.log("Payment verification failed");
      res.status(400).json({ status: 'verification_failed' });
    }
  } catch (error) {
    console.error("Error verifying payment", error);
    res.status(500).json({ status: 'error', message: "Failed to verify payment." });
  }
});

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.get("/purchase", (req, res) => {
  res.sendFile(__dirname + "/public/purchase.html");
});

app.get('/payment-cancel', (req, res) => {
  res.sendFile(__dirname + '/public/payment-cancel.html');
});

app.get('/payment-success', (req, res) => {
  res.sendFile(__dirname + '/public/payment-success.html');
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});