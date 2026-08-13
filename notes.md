

#### Checkpoint 1 — Closing the old cycle, opening the new one

Step 1 — Open psql (your database tool):

bash
psql -U postgres -d chama_db

Step 2 — Tell the database "today is this chama's cycle day." This is needed because the code only processes chamas whose cycle_day matches today's date — it's how it knows which chama to act on:

sql
UPDATE chamas SET cycle_day = 12 WHERE chat_id = -5335853740;

(This just says: "TestGroup2's cycle closes on the 12th" — and since today IS the 12th, it'll get picked up.)

Step 4 — Actually trigger the close. This is the one command that does everything — closes the old cycle, calculates fines, opens a new cycle, sends the group message:

bash
curl http://localhost:3000/debug/run-cycles

*************************
What just happened, under the hood (for when they ask): your code looked at every chama, found the one whose cycle_day matched today, then:

Marked the old cycle as closed
Calculated each member's shortfall
Created fine rows for anyone short (this is Checkpoint 2 — automatic, same step)
Opened a brand new cycle
Sent the summary message to the group



### CHECKPOINT2
CHECKING ANY MMBER WHO PAID LESS IN DB 

### psql -U postgres -d chama_db
### SELECT * FROM fines ORDER BY id DESC LIMIT 3;

***********
#### Checkpoint 3 — Reminders (group nudge + private DM)

Step 1 — Tell the database "tomorrow is this chama's cycle day":

bash
#### psql -U postgres -d chama_db
UPDATE chamas SET cycle_day = 13 WHERE chat_id = -5335853740;

Trigger the reminder job:

bash
curl http://localhost:3000/debug/run-reminders

What to see open Telegram. You should see two things:

A message in the group listing who still owes money.
A private message sent directly to that member.

### Checkpoint 4 — Cron runs get logged

This one needs no new command at all — it's just proof that already happened automatically every time you ran Checkpoints 1 or 3 above. Every time a job runs, it writes a row to a table.

Show it:

bash
psql -U postgres -d chama_db
sql
### SELECT * FROM cron_runs ORDER BY id DESC LIMIT 1;


### Checkpoint 5 — PDF reaches the treasurer
Step 1 — Trigger it:

bash
curl http://localhost:3000/debug/test-pdf

Step 2 — Show the file was created on your computer:

bash
ls reports/