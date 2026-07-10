# High-Concurrency Ticketing Engine

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)
![Artillery](https://img.shields.io/badge/Artillery.io-2A2147?style=for-the-badge&logo=artillery&logoColor=white)

A high-throughput backend API designed to process event ticket reservations under massive traffic spikes with a guarantee of **zero double-bookings**. 
This project explores strict database-level concurrency control, effectively mitigating the race conditions that typically crash or corrupt distributed ticketing systems 

## The Problem & Architecture

In high-concurrency environments, application-level checks (e.g., checking if a seat is available in Node.js before updating it) fail under pressure. If 500 users request the same ticket simultaneously, the application reads the seat as "available" for all of them before the first database write completes, resulting in massive overbooking.

## Benchmarks & Load Testing

To validate the architecture, the containerized API was subjected to strict breakpoint load testing using **Artillery**. The goal was to find the system's "Latency Cliff" on local hardware constraints 

### **Test Results:**
* **Total Simulated Traffic:** 7,000 concurrent requests over a 40-second ramp.
* **Peak Throughput:** The system sustained **202 Write Transactions Per Second (TPS)** before latency degraded.
* **Latency Profile:** Maintained a blazing-fast **p99 latency of <40ms** while in the safe operational zone.
* **Data Integrity:** `0` failed requests, `0` double-bookings. The vault successfully processed all requests, safely returning `404 Sold Out` once inventory depleted without timing out or dropping connections.

*Note: Benchmarks reflect local, hardware-shared Docker environments. Deployed to a dedicated Linux VPS, RPS thresholds scale linearly with available CPU/DB connection pools.*

##  Getting Started

The entire architecture (Node API + PostgreSQL + configuration) is fully containerized. You do not need to install Node or Postgres on your machine.

### Prerequisites
* Docker & Docker Compose

### Installation & Execution
1. **Clone the repository:**
   ```bash
   git clone [https://github.com/YourUsername/ticketing-system-engine.git](https://github.com/YourUsername/ticketing-system-engine.git)
   cd ticketing-system-engine

2. **Boot the Architecture:**
   ```bash
   docker compose up -d

4. **Reset the Database(if needed):**
   ```bash
   docker compose down -v && docker compose up -d

##  API Reference
1. **Request Body:**
   ```JSON
   {
   "userId": 99,
   "eventId": 1
   }

2. **Success Response:**
   ```JSON
   {
   "message": "Ticket successfully booked",
   "ticketId": 42
   }

3. **Failure Response:**
   ```JSON
   {
   "error": "Sorry, no seats are currently available!"
   }

### Running the Stress Tests
   ```bash
   npx artillery run load_test.yml
  


