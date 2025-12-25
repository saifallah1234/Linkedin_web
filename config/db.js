const mongoose = require('mongoose');

const clientOptions = { 
  serverApi: { version: '1', strict: true, deprecationErrors: true } 
};

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI; 
    
    await mongoose.connect(uri, clientOptions);
    
    await mongoose.connection.db.admin().command({ ping: 1 });

    console.log("✅ Successfully connected to MongoDB Atlas (Database: linkedin)!");
    
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;