// server/config/db.js

// 1. IMPORT MONGOOSE
// ==============================================================================
// Mongoose is the package that will help us communicate with our MongoDB database.
const mongoose = require('mongoose');

// 2. CREATE THE DATABASE CONNECTION FUNCTION
// ==============================================================================
// We are creating an 'async' function. This allows us to use the 'await' keyword,
// which is necessary because connecting to a database is an asynchronous operation
// (it takes some time to complete).
const connectDB = async () => {
  try {
    // This line is for debugging purposes. It logs the MongoDB URI to the console.
    // It's helpful to ensure that the connection string is correct.
    console.log('MongoDB URI:', process.env.MONGO_URI);
    
    // This is the core of the connection. mongoose.connect() attempts to connect
    // to the MongoDB database using the connection string provided.
    // process.env.MONGO_URI is how we will access our secret connection string.
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are no longer needed in newer Mongoose versions but kept for compatibility
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // If the connection is successful, we log a message to the console.
    // conn.connection.host will show the database host we are connected to.
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If there is an error during connection, we log the error message.
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // process.exit(1) will exit the Node.js process with a failure code.
    // This is important because if we can't connect to the database, our app can't run.
    process.exit(1);
  }
};

// 3. EXPORT THE FUNCTION
// ==============================================================================
// module.exports is the Node.js way of making a function or object from one file
// available to be used in another file.
module.exports = connectDB;