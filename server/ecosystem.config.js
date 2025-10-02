module.exports = {
  apps: [
    {
      name: "madrassaplay-api",
      script: "index.js",   // or app.js (your main server file)
      env: {
        NODE_ENV: "production",
        MONGO_URI: "mongodb://madrassa:2004@localhost:27017/madrassaplay?authSource=madrassaplay",
        JWT_SECRET: "df4ff0c90921816d1a252a13ab837382"
      }
    }
  ]
};
