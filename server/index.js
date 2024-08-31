const express = require('express');
const connectDB = require('./db.js');
const farmerModel = require('./models/farmers.js');
const userModel = require('./models/users.js');
const crypto = require('crypto'); 
const cors = require('cors');
const bodyParser = require('body-parser');
const Razorpay = require('razorpay');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

connectDB();

// Razorpay configuration
const razorpay = new Razorpay({
  key_id: 'rzp_test_512Znk0awantVQ',
  key_secret: 'h3l4a95FYwpeouwRHivNbJuY', 
});

// Route to create an order
app.post('/api/create-order', async (req, res) => {
  const { amount, currency, receipt, notes } = req.body;

  const options = {
    amount: amount * 100, // Convert to paise
    currency,
    receipt,
    payment_capture: 1, // Auto-capture
    notes,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Route to verify payment
app.post('/api/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const generated_signature = crypto
    .createHmac('sha256', razorpay.key_secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generated_signature === razorpay_signature) {
    // Signature is valid
    res.json({ status: 'ok' });
    // TODO: Update order status in your database
  } else {
    // Invalid signature
    res.status(400).json({ status: 'verification_failed' });
  }
});



// // Route to create an order
// app.post('/api/create-order', async (req, res) => {
//   try {
//     const { amount, currency, receipt } = req.body;
    
//     const options = {
//       amount: amount * 100, // Amount in paise
//       currency,
//       receipt,
//       payment_capture: 1 // 1 for auto-capture, 0 for manual
//     };

//     const order = await razorpay.orders.create(options);
//     res.json(order);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Error creating order');
//   }
// });

// // Route to verify payment
// app.post('/api/verify-payment', (req, res) => {
//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//   const body = razorpay_order_id + '|' + razorpay_payment_id;
//   const expectedSignature = crypto
//     .createHmac('sha256', razorpay.key_secret)
//     .update(body.toString())
//     .digest('hex');

//   if (expectedSignature === razorpay_signature) {
//     res.status(200).json({ status: 'ok' });
//   } else {
//     res.status(400).json({ status: 'verification_failed' });
//   }
// });


app.post("/userlogin", async (req, res) => {
    const { mail, password } = req.body;

    try {
        const user = await userModel.findOne({ mail });

        if (user) {
            if (user.password === password) {
                res.json("exist");
            } else {
                res.json("notexist");
            }
        } else {
            res.json("notexist");
        }
    } catch (e) {
        res.json("fail");
    }
});

app.post("/farmerlogin", async (req, res) => {
    const { mail, password } = req.body;

    try {
        const user = await farmerModel.findOne({ mail });

        if (user) {
            if (user.password === password) {
                res.json("exist");
            } else {
                res.json("notexist");
            }
        } else {
            res.json("notexist");
        }
    } catch (e) {
        res.json("fail");
    }
});

app.post("/usersignup", async (req, res) => {
    const { name, mail, password } = req.body;

    const data = {
        name,
        mail,
        password,
        orders: []
    };

    try {
        const check = await userModel.findOne({ mail });

        if (check) {
            res.json("exist");
        } else {
            await userModel.create(data);
            res.json("inserted");
        }
    } catch (e) {
        res.json("fail");
    }
});

app.post("/farmersignup", async (req, res) => {
    const { name, mail, password } = req.body;

    const data = {
        name,
        mail,
        password,
        products: []
    };

    try {
        const check = await farmerModel.findOne({ mail });

        if (check) {
            res.json("exist");
        } else {
            await farmerModel.create(data);
            res.json("inserted");
        }
    } catch (e) {
        res.json("fail");
    }
});



app.get('/api/products', async (req, res) => {
    const farmers = await farmerModel.find();
    const products = farmers.map(farmer => farmer.products).flat();
    res.json(products);
});

// Fetch farmer's products
app.get('/api/farmer/products', async (req, res) => {
    const farmer = await farmerModel.findOne({ mail: req.query.mail });
    res.json(farmer.products);
});

// Add a new product (Farmer's action)
app.post('/api/farmer/products', async (req, res) => {
    const farmer = await farmerModel.findOne({ mail: req.body.mail });
    const newProduct = {
        title: req.body.title,
        description: req.body.description,
        cost: req.body.cost,
        image: req.body.image
    };
    farmer.products.push(newProduct);
    await farmer.save();
    res.json(newProduct);
});

// Remove a product (Farmer's action)
app.delete('/api/farmer/products/:id', async (req, res) => {
    const farmer = await farmerModel.findOne({ mail: req.query.mail });
    farmer.products.id(req.params.id).remove();
    await farmer.save();
    res.status(204).send();
});

// Purchase a product (User's action)
app.post('/api/orders', async (req, res) => {
    const user = await userModel.findOne({ mail: req.body.mail });
    const newOrder = {
        title: req.body.title,
        description: req.body.description,
        cost: req.body.cost,
        image: req.body.image
    };
    user.orders.push(newOrder);
    await user.save();
    res.json(newOrder);
});

app.listen(process.env.PORT || 3000, () => {
    console.log("App is running on port 3000");
});