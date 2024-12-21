# Razorpay Integration POC

This project is a Proof of Concept (POC) for integrating Razorpay, a popular payment gateway, with an Express.js application. The project demonstrates the basic setup and usage of Razorpay's APIs to handle payment processing, order creation, and webhook verification.

## Features
- Integration with Razorpay for payment processing
- Creating and managing orders
- Handling payment callbacks and webhooks
- Storing order information locally in a JSON file

## Installation and Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Salmandabbakuti/razorpay-integration-poc.git
   cd razorpay-integration-poc
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure your Razorpay credentials:**
   - Obtain your API key and secret from the Razorpay dashboard.
   - Create a `.env` file in the root directory and add your credentials:
```.env
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

4. **Start the application:**
   ```bash
   npm start
   ```

## API Endpoints
### Create Order
**Endpoint:** `POST /create-order`
**Description:** Creates a new order in Razorpay and stores the order details locally.
**Payload:**
```json
{
  "amount": 500,
  "currency": "INR"
}
```

### Verify Payment
**Endpoint:** `POST /verify-payment`
**Description:** Verifies the payment using Razorpay's webhook signature and updates the order status.
**Payload:**
```json
{
  "razorpay_order_id": "order_id",
  "razorpay_payment_id": "payment_id",
  "razorpay_signature": "signature"
}
```

## Usage
1. **Create an order:**
   ```javascript
   const orderOptions = {
     amount: 50000, // amount in paise
     currency: "INR",
     receipt: "order_rcptid_11",
     notes: {
       userId: "123",
       plan: "basic",
       email: "johndoe@gmail.com"
     }
   };

   const response = await razorpay.orders.create(orderOptions);
   console.log(response);
   ```

2. **Verify payment:**
   ```javascript
   const isValidSignature = validateWebhookSignature(body, razorpay_signature, RAZORPAY_KEY_SECRET);
   if (isValidSignature) {
     console.log("Payment verification successful");
   } else {
     console.log("Payment verification failed");
   }
   ```

## Static Pages
- `/purchase`: Displays the purchase page
- `/payment-cancel`: Displays the payment cancel page
- `/payment-success`: Displays the payment success page

## Contributing
Feel free to open issues or submit pull requests if you find any bugs or want to improve the project.

## License
This project is licensed under the MIT License
