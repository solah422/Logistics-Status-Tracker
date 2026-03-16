# Logistics Status Tracking App

A comprehensive, feature-rich logistics and package tracking application built with React, TypeScript, and Tailwind CSS.

## Features

- **Package Management**: Create, read, update, and soft-delete packages.
- **Kanban Board View**: Drag-and-drop packages between status columns for visual workflow management.
- **Customizable Dashboard**: A dynamic dashboard with 15+ draggable, resizable widgets (charts, stats, weather, news, etc.).
- **Context Menus**: Right-click on package rows for quick actions like Edit, Copy Tracking, Delete, and Status Change.
- **Priority Indicators**: Color-coded visual cues for package priority levels (Low, Medium, High, Urgent).
- **Collapsible Table Rows**: Expand rows to see full package details, notes, and history without leaving the list view.
- **Status Tracking**: Track package statuses with a detailed history and enhanced visual progress steppers.
- **Inline Editing**: Quickly edit package dates (submitted, released) and statuses directly from the list view.
- **Advanced Filtering**: Filter by status, date ranges, and document availability. Save custom filter views.
- **Custom Fields**: Dynamically add and manage custom fields for packages.
- **Google Drive Sync**: Sync your database with a JSON file hosted on Google Drive using the File System Access API.
- **Import/Export**: Drag-and-drop support for CSV and JSON file imports and exports.
- **Automated Archiving**: Automatically archive packages that have reached their final status.
- **UI/UX Enhancements**: Full dark mode support with theme toggle, skeleton loaders, toast notifications, collapsible sidebar, and mobile-optimized card views.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Storage**: LocalStorage & IndexedDB (`idb-keyval`) for local persistence and Drive sync handles.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd <project-directory>
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:

```bash
npm run dev
```

### Build

Build the application for production:

```bash
npm run build
```

## License

MIT
