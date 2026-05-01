module.exports = {
  apps: [
    {
      name: 'canteen-backend',
      script: './server.js',
      exec_mode: 'cluster',
      instances: 'max',
      watch: false,
      max_memory_restart: '512M',
      node_args: '--no-deprecation',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production',
        ENABLE_HTTP_LOG: 'false',
        LOAD_TEST_MODE: 'false'
      }
    }
  ]
};
