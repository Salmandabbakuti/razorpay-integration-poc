const express = require("express");
const Razorpay = require("razorpay");
const fs = require("fs");
const {
  validateWebhookSignature
} = require("razorpay/dist/utils/razorpay-utils");
const {
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET
} = require("./config");

const app = express();

// Middleware
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

// Utility functions
const readData = () =>
  fs.existsSync("orders.json")
    ? JSON.parse(fs.readFileSync("orders.json"))
    : [];

const writeData = (data) =>
  fs.writeFileSync("orders.json", JSON.stringify(data, null, 2));

if (!fs.existsSync("orders.json")) writeData([]); // Initialize file if not exists

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET
});

// Signature validation function
const validateSignature = (body, signature, secret, type = "webhook") => {
  console.log(`Validating signature for ${type}`);
  try {
    if (type === "webhook") {
      return validateWebhookSignature(JSON.stringify(body), signature, secret);
    }
    return validateWebhookSignature(body, signature, secret);
  } catch (error) {
    console.error("Error validating signature", error);
    return false;
  }
};

// Generic payment verification handler
const handlePaymentVerification = (
  orderId,
  paymentId,
  status = "paid",
  notes = []
) => {
  console.log("Verifying payment:", orderId, paymentId, status, notes);
  const orders = readData();
  const order = orders.find((o) => o.order_id === orderId);
  if (order) {
    order.status = status;
    order.payment_id = paymentId;
    writeData(orders);
    return true;
  }
  return false;
};

// Routes
app.post("/create-order", async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const options = {
      amount: amount * 100,
      currency,
      receipt: "order_rcptid_11",
      notes: {
        userId: "123",
        plan: "basic",
        email: "johndoe@gmail.com"
      }
    };
    const response = await razorpay.orders.create(options);
    console.log("Order created:", response);
    const orders = readData();
    orders.push({
      order_id: response.id,
      amount: response.amount,
      currency: response.currency,
      receipt: response.receipt,
      notes: response.notes,
      createdBy: "123"
    });
    writeData(orders);

    res.status(200).send(response);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).send(error);
  }
});

app.post("/verify-payment", async (req, res) => {
  console.log("Verifying payment in callback route", req.body);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const isValidSignature = validateSignature(
    body,
    razorpay_signature,
    RAZORPAY_KEY_SECRET,
    "callback"
  );

  if (isValidSignature) {
    const isPaymentVerified = handlePaymentVerification(
      razorpay_order_id,
      razorpay_payment_id
    );
    if (isPaymentVerified) {
      console.log("Payment verification complete in callback route");
      res.status(200).json({ status: "ok" });
    } else {
      console.log("Payment verification failed in callback route");
      res.status(400).json({ status: "payment verification_failed" });
    }
  } else {
    console.log("Signature verification failed in callback route");
    res.status(400).json({ status: "signature verification_failed" });
  }
});

app.post("/payment-webhook", async (req, res) => {
  console.log("Received webhook payload:", req.body);
  const signature = req.headers["x-razorpay-signature"];
  console.log("Received webhook signature:", signature);
  const isValidSignature = validateSignature(
    req.body,
    signature,
    RAZORPAY_WEBHOOK_SECRET,
    "webhook"
  );
  console.log("Signature verification status:", isValidSignature);
  if (isValidSignature) {
    const { event, payload } = req.body;
    switch (event) {
      case "payment.captured":
        const isPaymentVerified = handlePaymentVerification(
          payload.order.entity.id,
          payload.payment.entity.id,
          "paid",
          payload.order.entity.notes
        );
        if (isPaymentVerified) {
          console.log("Payment verification complete in webhook route");
          res.status(200).json({ status: "ok" });
        } else {
          console.log("Payment verification failed in webhook route");
          res.status(400).json({ status: "payment verification_failed" });
        }
        break;
      default:
        console.log("Unhandled webhook event:", event);
        res.status(200).json({ status: "ok" });
    }
  } else {
    console.log("Signature verification failed in webhook route");
    res.status(400).json({ message: "signature verification_failed" });
  }
});

app.get("/", (req, res) => res.send("Hello World"));
app.get("/purchase", (req, res) =>
  res.sendFile(__dirname + "/public/purchase.html")
);
app.get("/payment-cancel", (req, res) =>
  res.sendFile(__dirname + "/public/payment-cancel.html")
);
app.get("/payment-success", (req, res) =>
  res.sendFile(__dirname + "/public/payment-success.html")
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
