module.exports = {
  apps: [
    {
      name: 'samalocation-scraper',
      script: './src/index.js',
      instances: 1,
      autorestart: true, // Keeps the daemon process running
      watch: false,
      max_memory_restart: '300M', // Safe limit for Playwright memory usage
      env: {
        NODE_ENV: 'production',
        RUN_INTERVAL_HOURS: '12' // Configures the script to execute every 12 hours
      }
    }
  ]
};
