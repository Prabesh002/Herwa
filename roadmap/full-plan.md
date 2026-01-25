

### **Phase 1: Governance & Logic (The "Brain")**
*Goal: Move control out of the code and into the database. You should be able to turn features on/off, restrict commands, and manage subscriptions without deploying new code.*

**1.1. Dynamic Feature System (SaaS Foundation)**
- [ ] **Database Structure:** Create the "Switchboard." Tables to define Features (e.g., "Voice Analytics"), Modules, and Subscription Tiers (Free vs. Premium).
- [ ] **Feature Discovery:** A script that automatically detects your code commands and registers them in the database so you can manage them.
- [ ] **Guild Configs:** The ability to toggle specific features On or Off for specific servers (e.g., disabling "Music" but keeping "Stats").

**1.2. Role-Based Access Control (RBAC)**
- [ ] **Custom Permissions:** Go beyond Discord's "Admin" role. Allow server owners to say: *"Only the 'Support' role can view Ticket Stats"* or *"Block 'New Members' from using Voice Commands."*
- [ ] **Channel Allow-listing:** Restrict spammy analytics commands to specific channels only.
- [ ] **The Guardrail Service:** A central check that runs before *every* command to enforce Subscriptions, Feature Toggles, and RBAC permissions.

**1.3. Visual Polish (Quick Wins)**
- [ ] **Chart Images:** Update `/server-stats` to generate and attach a beautiful line chart image (using `chartjs`) instead of just text.



### **Phase 2: Scalability & Data Health (The "Engine")**
*Goal: Ensure the system can handle 10,000+ servers without slowing down or crashing storage.*

**2.1. The "Infinite Loop" Prevention**
- [ ] **Postgres Cleanup:** Automate the deletion of data in PostgreSQL once it has been safely moved to ClickHouse. Keep PostgreSQL empty and fast.
- [ ] **ClickHouse Aging:** Configure "Time-to-Live" rules. Keep high-precision data for 3 months, then automatically compress it into "Hourly Summaries" for long-term history to save storage space.

**2.2. Performance Caching**
- [ ] **Permission Cache:** Store guild permissions in memory (RAM) for a few minutes so the bot doesn't spam the database every time a user types a command.



### **Phase 3: The API Layer (The "Bridge")**
*Goal: Create a secure doorway for the outside world (Websites) to talk to your data.*

**3.1. The API Service**
- [ ] **New Microservice:** Create `herwa-api`. It runs separately from the bot so a website crash doesn't kill the bot.
- [ ] **Authentication:** Implement "Login with Discord" so we know who is asking for data.
- [ ] **Data Endpoints:** Create secure URLs (e.g., `GET /api/guilds/{id}/stats`) that fetch data directly from ClickHouse.

**3.2. Developer Access (The "Moat")**
- [ ] **API Keys:** A system for generating secret keys (`sk_live_...`).
- [ ] **Traffic Control:** Implement Rate Limiting (e.g., "100 requests per minute") to prevent developers from crashing your server.



### **Phase 4: The Web Platform (The "Experience")**
*Goal: A beautiful dashboard where admins can see graphs and manage their bot.*

**4.1. The User Dashboard**
- [ ] **Web Frontend:** A Next.js/React website.
- [ ] **Visual Graphs:** Interactive charts (Zoom, Pan, Filter) showing the rich data from ClickHouse.
- [ ] **Configuration UI:** A settings page where admins can toggle features and set up the RBAC permissions we built in Phase 1.

**4.2. The Super Admin Panel (For You)**
- [ ] **Global Overview:** See how many servers Herwa is in, total commands run, and system health.
- [ ] **Subscription Management:** Manually grant "Premium" status to servers or revoke access.



### **Phase 5: Future-Proofing (The "Enterprise")**
*Goal: Features that attract massive communities.*

**5.1. Data Exports**
- [ ] **CSV/JSON Export:** Allow admins to download their entire server history for their own records (Premium feature).

**5.2. Widget Builder**
- [ ] **Embeddable Widgets:** A tool where admins can design a small "Live Stats" card and get a snippet of HTML code to paste onto their own clan websites.

