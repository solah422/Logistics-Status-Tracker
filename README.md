# 📦 LogiTrack Pro

> **The ultimate command center for modern logistics and package management.**

LogiTrack Pro is a state-of-the-art, fully responsive React application designed to streamline package tracking, optimize operational workflows, and provide real-time analytics for logistics teams. Built with performance and user experience in mind, it transforms complex supply chain data into actionable, beautifully visualized insights.

---

## ✨ Key Features

### 🧩 Fully Customizable Dashboard
Your workspace, your rules. The dashboard is powered by a robust drag-and-drop engine (`@dnd-kit`).
- **Drag & Drop**: Rearrange widgets to suit your daily workflow.
- **Resizable Widgets**: Toggle widgets between Small, Medium, and Large footprints.
- **Rich Widget Library**: Includes Total Packages, Recent Activity, Live Weather, Quick Notes, Logistics News, Priority Breakdowns, and Upcoming Deadlines.

### 📋 Omni-View Package Management
Visualize your freight exactly how you want to.
- **Data Table View**: High-density, sortable, and filterable list for power users. Includes inline editing and collapsible rows with a visual **Progress Stepper**.
- **Kanban Board View**: Drag-and-drop cards across status columns for a visual pipeline of your operations.
- **Context Menus**: Right-click any package to instantly Edit, Copy Tracking, Change Status, or Delete without opening a modal.
- **Priority Indicators**: Color-coded visual cues (Low, Medium, High, Urgent) ensure critical shipments never slip through the cracks.

### 📊 Intelligent Reporting & Analytics
Turn raw data into strategic decisions.
- **Interactive Charts**: Beautiful, responsive pie and bar charts powered by `recharts`.
- **Performance Metrics**: Track average processing times and status distributions.
- **One-Click PDF Export**: Generate professional, formatted PDF reports of your current data instantly using `html2canvas` and `jsPDF`.

### ☁️ Advanced Sync & Automation
- **Google Drive Integration**: Seamlessly import and export your entire database to Google Drive for secure, decentralized backups.
- **Automated Archiving**: Keep your active workspace clean with smart auto-archiving for completed or cancelled shipments.
- **Custom Fields**: Extend the data model on the fly with custom text, number, date, or dropdown fields.

---

## 🛠️ Tech Stack

LogiTrack Pro is built on a modern, type-safe foundation:

*   **Core**: React 18, TypeScript, Vite
*   **Styling**: Tailwind CSS (with Dark Mode support)
*   **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`
*   **Data Visualization**: `recharts`
*   **Icons**: `lucide-react`
*   **Utilities**: `date-fns` (time manipulation), `html2canvas` & `jspdf` (reporting)

---

## 🚀 Getting Started

### Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18+) and `npm` installed.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/logitap-pro.git
   cd logitap-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

---

## 💡 Usage Guide

### Customizing the Dashboard
1. Navigate to the **Dashboard** tab.
2. Click the **Customize** button in the top right.
3. Use the grip icon (⋮⋮) to drag widgets around.
4. Hover over a widget's header to reveal the resize buttons (S, M, L) and the remove (X) button.
5. Click **Done** to save your layout to local storage.

### Using the Kanban Board
1. Navigate to the **Packages** tab.
2. Click the **Board** icon (layout-dashboard) in the top right view toggle.
3. Drag package cards between columns to instantly update their status.
4. Notice the color-coded left border on cards indicating priority (Red = Urgent, Amber = High, Blue = Medium, Gray = Low).

### Generating Reports
1. Navigate to the **Reports** tab.
2. Use the **Date Range** filter to scope your data (e.g., "Last 30 Days").
3. Click **Export PDF** to generate a downloadable snapshot of your charts and metrics.

---

## 🤝 Contributing

We welcome contributions to make LogiTrack Pro even better! 
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ for logistics professionals everywhere.*
