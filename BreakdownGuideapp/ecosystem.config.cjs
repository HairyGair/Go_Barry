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
  ],
};
