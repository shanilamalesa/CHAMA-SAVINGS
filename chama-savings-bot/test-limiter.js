const { Queue } = require("bullmq");
const connection = { host: "127.0.0.1", port: 6379 };

const q = new Queue("notifications", { connection });

(async () => {
    for (let i = 1; i<=20; i++){
        await q.add("test", { n:i });
    }
    console.log("20 jobs queued");
    await q.close();
    process.exit(0);
})();




