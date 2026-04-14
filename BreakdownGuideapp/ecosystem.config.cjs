module.exports = {
  apps: [
    {
      name: "breakdown-backend",
      cwd: "/home/gobarryco/api",
      script: "server.js",
      node_args: "--no-experimental-fetch",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      max_memory_restart: "512M",
      error_file: "/home/gobarryco/logs/breakdown-backend-error.log",
      out_file: "/home/gobarryco/logs/breakdown-backend-out.log",
      merge_logs: true,
      time: true,
    },
    {
      name: "deploy-webhook",
      cwd: "/home/gobarryco",
      script: "deploy-webhook.mjs",
      instances: 1,
      exec_mode: "fork",
      env: {
        WEBHOOK_PORT: 9876,
      },
      max_memory_restart: "64M",
      error_file: "/home/gobarryco/logs/deploy-webhook-error.log",
      out_file: "/home/gobarryco/logs/deploy-webhook-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
