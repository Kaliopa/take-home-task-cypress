const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "https://www.demoblaze.com/",
    env: {
      apiUrl: "https://api.demoblaze.com",
    },
    viewportHeight: 1600,
    viewportWidth: 1200,
    allowCypressEnv: false,
    retries: {
      runMode: 3,
      openMode: 0,
    },
  },
});
