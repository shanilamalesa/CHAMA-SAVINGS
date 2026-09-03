require("dotenv").config();
require("./httpServer");
require("./workers/notification.worker");
// require("./workers/whatsapp.worker");  // no sender yet — see ARCHITECTURE.md