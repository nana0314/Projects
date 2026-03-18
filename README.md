# Nana0314's Projects Portfolio 🚀

Welcome to my project repository! This collection showcases my journey across full-stack web development, mobile applications, IoT systems, and algorithmic research.

## 🌟 Featured Projects

### 1. [Smart Split](./Smart%20Split) 🐻

**[https://smart-split-bay.vercel.app/](https://smart-split-bay.vercel.app/)**

**Tech Stack:** Next.js 15, TypeScript, Firebase, Tailwind CSS, PWA

A modern, AI-powered Progressive Web App for finance expenses tracking and splitting with friends.

- **AI Integration:** Uses Vertex AI (Gemini) for receipt scanning and NLP for chat-based expense entry.
- **Complex Logic:** Algorithms for debt simplification and partial payments.
- **Data Viz:** Interactive dashboards for spending trends and debt networks.

### 2. [FanFan — Tinder Styled Recipe](./FanFan) 🍳

**Tech Stack:** Next.js 15, TypeScript, Firebase, Tailwind CSS, Spoonacular API, PWA, Playwright

A Tinder-style recipe discovery Progressive Web App — swipe through recipes, save favorites into Meal Packs, and filter by cuisine, diet, and meal type.

- **Gesture-Driven UI:** Swipe left to skip, swipe right to undo, swipe up to save, tap to preview ingredients, double-tap for full details.
- **Meal Packs:** User-created recipe collections with duplicate detection, backed by localStorage (guest) or Firebase Firestore (authenticated).
- **Smart Queue:** FIFO recipe queue with history stack for undo, automatic looping, and prefetch batching from Spoonacular API.
- **E2E Testing:** 48 Playwright tests with full API mocking — zero external API calls during test runs.

### 3. [Together — Local Coordination Forum](./Together) 🤝

**Tech Stack:** Next.js 15, TypeScript, Firebase, Tailwind CSS, PWA, Playwright

**Purpose:** Together helps people coordinate locally before meeting in person — whether splitting an Uber, sharing a Costco membership, or organizing a group buy. Post a discussion, find interested people in the comments, then move private coordination into DMs or group chats. Real Google names and photos on every interaction build trust before you meet up.

- **Discussion Posts:** Topic headers (e.g. "Ride Share Cambridge"), markdown body (bold/italic), hashtags, public/private visibility.
- **Bilingual Search:** English keyword search + Chinese bigram tokenizer for mixed-language hashtags and keywords.
- **Social Layer:** Friend requests, notifications, direct messages, group chats — friends only.
- **Trust by Default:** Google Sign-In ensures every commenter's real name and photo is always visible.
- **E2E Testing:** 133 Playwright tests covering feed, posts, comments, search (English + Chinese), friends, DMs, group chats, and navigation.

### 4. [Stayin' Alive](./Stayin'%20Alive) 🏥

**Tech Stack:** React Native, Expo

A personal safety application designed to ensure user well-being.

- **Automated Check-ins:** Daily check-in system to confirm safety.
- **Emergency Protocols:** Automatically notifies emergency contacts if inactivity is detected for 48 hours.
- **Background Tasks:** Monitors user activity efficiently without draining battery.

### 5. [Home Security IoT System](./Yeoh%20Zi%20Song's%20FYP) 🔒

**Tech Stack:** Raspberry Pi, Python, IoT Sensors

My Final Year Project (FYP) implementing a comprehensive "Well-Rounded IoT-based Home Security System".

- **Hardware Integration:** NFC/RFID access control, motion detectors, and cameras.
- **Remote Control:** Integrated with Blynk app for remote monitoring.
- **Lock-Down Mechanism:** Special feature to secure the premises instantly in emergencies.

### 6. [Credit Card Transaction Analytics Dashboard](./Credit%20Card%20Fraud%20&%20Transactions%20Analytics%20Dashboard) 💳

**Tech Stack:** Power BI, DAX, Data Modeling

A comprehensive 4-page Power BI dashboard analyzing **1.3 million credit card transactions** using a star schema data model.

- **Data Modeling:** Star schema design with 1 fact table and 4 dimension tables.
- **DAX Calculations:** 20+ measures covering KPIs, fraud detection, time intelligence, and customer analytics.
- **Data Visualization:** Executive KPIs, fraud intelligence, spending behavior analysis, and customer segmentation.

---

## 📚 University & Academic Projects

A collection of my coursework and research projects exploring algorithms and foundational software engineering.

### [University Projects Archive](./University%20projects)

- **Software Engineering Group Project (Board Game Digitization):** Full academic year project digitizing a physical board game, working closely with clients.
- **Travelling Salesman Problem (TSP) Research:**
  - **Comparison of Algorithms:** Conference paper comparing Lin-Kernighan, Nearest Neighbor, and Ant Colony Optimization.
  - **Courier Service Optimization:** Applied TSP algorithms to optimize delivery routes in Berlin.
- **Java Applications:**
  - **Covid Management System:** Tracking mall entry/exit and social distancing.
  - **2048 Game Refactor:** Debugged and enhanced a JavaFX version of the 2048 game.
- **C Libraries:** Created a custom library `library.c` for managing books using linked lists.
- **Web Development:** Created a video search engine using YouTube Data API.

---

## 📫 Contact

Feel free to explore the code in each folder!