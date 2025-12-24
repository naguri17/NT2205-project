/**
 * PM2 Ecosystem Configuration
 * Quản lý tất cả apps trong monorepo
 *
 * Commands:
 *   pm2 start ecosystem.config.cjs          # Start all apps
 *   pm2 start ecosystem.config.cjs --only client  # Start specific app
 *   pm2 stop all                            # Stop all apps
 *   pm2 restart all                         # Restart all apps
 *   pm2 logs                                # View logs
 *   pm2 monit                               # Monitor dashboard
 *   pm2 delete all                          # Remove all processes
 */

module.exports = {
  apps: [
    // =========================================
    // Frontend Apps (Next.js)
    // =========================================
    {
      name: "client",
      cwd: "./apps/client",
      script: "node_modules/.bin/next",
      args: "start",
      // Run the shell wrapper so pm2 doesn't try to execute the script as JS
      interpreter: "/bin/sh",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      watch: false,
      max_memory_restart: "500M",
      error_file: "./logs/client-error.log",
      out_file: "./logs/client-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
    {
      name: "admin",
      cwd: "./apps/admin",
      script: "node_modules/.bin/next",
      args: "start --port 3001",
      interpreter: "/bin/sh",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 3001,
      },
      watch: false,
      max_memory_restart: "500M",
      error_file: "./logs/admin-error.log",
      out_file: "./logs/admin-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },

    // =========================================
    // Backend Microservices
    // =========================================
    {
      name: "product-service",
      cwd: "./apps/product-service",
      script: "node_modules/.bin/tsx",
      args: "--env-file=${ENV_FILE:-.env} src/index.ts",
      interpreter: "/bin/sh",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 8000,
        ENV_FILE: ".env.production",
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 8000,
      },
      watch: false,
      max_memory_restart: "300M",
      error_file: "./logs/product-service-error.log",
      out_file: "./logs/product-service-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
    {
      name: "order-service",
      cwd: "./apps/order-service",
      script: "node_modules/.bin/tsx",
      args: "--env-file=${ENV_FILE:-.env} src/index.ts",
      interpreter: "/bin/sh",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 8001,
        ENV_FILE: ".env.production",
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 8001,
      },
      watch: false,
      max_memory_restart: "300M",
      error_file: "./logs/order-service-error.log",
      out_file: "./logs/order-service-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
    {
      name: "payment-service",
      cwd: "./apps/payment-service",
      script: "node_modules/.bin/tsx",
      args: "--env-file=${ENV_FILE:-.env} src/index.ts",
      interpreter: "/bin/sh",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 8002,
        ENV_FILE: ".env.production",
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 8002,
      },
      watch: false,
      max_memory_restart: "300M",
      error_file: "./logs/payment-service-error.log",
      out_file: "./logs/payment-service-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};
