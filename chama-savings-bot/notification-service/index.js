require('dontev').config();

require('./workers/notification.worker.js');
require('./workers/whatsapp.worker.js');

console.log('Notification Service is running and listening for queue jobs ...');