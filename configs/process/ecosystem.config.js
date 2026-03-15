module.exports = {
  apps: [{
    name: "madrassaplay-api",
    script: "./server/server.js",
    env_production: {
      NODE_ENV: "production"
    }
  }]
}
