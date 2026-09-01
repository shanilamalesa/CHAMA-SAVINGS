// server/cron/registry.js

module.exports = [
  {
    name: "chama-cycles",
    schedule: "30 0 * * *",          // 00:30 every day
    timezone: "Africa/Nairobi",
    run: require("./tasks/chamaCycles").processCycles,
  },
  {
    name: "chama-reminders",
    schedule: "0 18 * * *",          // 18:00 every day -- evening reminder
    timezone: "Africa/Nairobi",
    run: require("./tasks/chamaCycles").sendCycleReminders,
  },
];