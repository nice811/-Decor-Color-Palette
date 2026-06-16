module.exports = {
  apps: [{
    name: "color-admin-api",
    script: "./server.js",
    interpreter: "node",
    instances: 2,
    env: {
      NODE_ENV: "prod"
    },
    max_memory_restart: "300M",
    restart_delay: 3000
  }]
}
