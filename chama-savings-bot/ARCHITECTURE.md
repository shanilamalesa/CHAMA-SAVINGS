# Notification Service Extraction Plan

## 1. Current Structure
- A monolithic Express application.
- Web server and BullMQ workers run in a single Node process, sharing a single heap/memory space.

## 2. Target Structure
- Two separate, independently deployable processes:
  1. `api/` (The Express HTTP server)
  2. `notification-service/` (The background workers)

## 3. What Moves vs. What Stays
- **Moving to `notification-service/`:** BullMQ workers, third-party senders (WhatsApp, Telegram, SMS implementations), and consumer queues.
- **Staying in `api/`:** Express routes, controllers, business services, and queue producers (adding jobs to the queue).

## 4. Communication Mechanism
- Asynchronous communication via shared Redis queues (BullMQ).
- Shared access to the central Postgres database.

## 5. Why Notifications First
- It is already asynchronous and queue-based. 
- The API drops a job in Redis and forgets about it; it does not wait for a return value, meaning the split won't change the API's core code.
- It protects checkout from flaky third-party communication APIs.

## 6. Explicit Non-Goals
- We are NOT splitting the database yet.
- We are NOT extracting the payments service yet.
- We are NOT setting up service discovery tools.
