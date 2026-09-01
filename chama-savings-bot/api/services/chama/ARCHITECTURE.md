# Chama Savings Platform - Architecture

## The System

A chama is a Kenyan savings group. Members pool money on a schedule (weekly or monthly). The platform automates treasurer duties and enables M-Pesa contributions.

```
  +----------------+     +-----------------+     +----------------+
  | Telegram bot   |     | Express server  |     |  Next.js admin |
  | (group chat)   |<--->|  - cron         |<--->|  (treasurer    |
  |                |     |  - payments     |     |   dashboard)   |
  +----------------+     |  - telegram     |     +----------------+
                         |  - outbox       |
                         +--------+--------+
                                  |
                         +--------+--------+
                         |   Postgres      |
                         +--------+--------+
```

All roads lead to Postgres. Telegram bot reads and writes. Cron reads and writes. Treasurer's dashboard reads and writes.

## Database Schema

- **chamas**: The group configuration (name, monthly amount, cycle day, treasurer)
- **chama_members**: Group membership with phone numbers for M-Pesa
- **cycles**: Contribution periods (open/closed)
- **contributions**: Individual payments a member made
- **fines**: Penalties for late payment
- **payouts**: Money going out to members
- **outbox**: Event log for async processing

## Core Invariants (NEVER BREAK THESE)

1. **One open cycle per chama at a time.** New cycles open when the previous one closes.
2. **A contribution's amount must exactly match the chama's monthly_amount** (or be explicitly marked as top-up/arrears).
3. **Sum of contributions minus sum of payouts = the chama's current balance.** Always. You derive it, you do not store it.
4. **A member can contribute to any open cycle their membership covers.**
5. **Fines can be paid separately from contributions, or added to the next contribution.** Either way, the fine row ends up `paid = true`.
6. **Everything happens in a transaction.** No half-confirmed contributions.

## Data Flow: Contribution Happy Path

1. Member types `/contribute` in the chama group
2. Bot responds with keyboard: "Contribute KSh X for Month Y" / "Custom amount"
3. Member clicks preset
4. Bot creates contribution row with status = 'pending'
5. Bot calls payments package to initiate STK Push
6. Member enters PIN on phone
7. Daraja webhook fires
8. Outbox worker picks up event:
   - Updates contribution to 'confirmed'
   - Announces in group: "@Name just contributed KSh X"
   - Shows cycle progress

## Data Flow: End of Cycle

Cron fires on cycle_day:

1. Find open cycle
2. Sum confirmed contributions
3. For members short: create fine row
4. Close cycle
5. Open new cycle
6. Send group summary

## Key Design Decisions

- **Bot-first product**: Members interact with Telegram; treasurer uses dashboard. No web frontend for balance (yet).
- **Cycle day 1-28 only**: Avoids February edge cases.
- **Treasurer is the /setup runner**: Simple, changeable later.
- **Public group summaries + private fines**: Accountability without over-sharing.
- **Atomic updates for idempotency**: "Only confirm if still pending" pattern.
