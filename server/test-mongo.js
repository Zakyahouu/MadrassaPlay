const mongoose = require("mongoose");

const uri = "mongodb://madrassa:2004@localhost:27017/madrassaplay?authSource=madrassaplay";

(async () => {
  try {
    console.log("🔗 Trying to connect to:", uri);
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("✅ Connected to MongoDB!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
    process.exit(1);
  }
})();
