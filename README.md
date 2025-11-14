# Oracle Fusion SQL Editor

A modern desktop application for executing SQL queries against Oracle Fusion using BI Publisher Web Services. Built with Electron, React, TypeScript, and Material UI.

![Oracle Fusion SQL Editor](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Version 1.0

#### Connection Management
- Create and manage multiple Oracle Fusion connections
- Secure encrypted credential storage
- Connection validation (URLs must end with oraclecloud.com)
- SSO authentication support
- HTTPS-only connections

#### Modern UI
- Beautiful Material UI design with dark/light themes
- Modern web-app feel in a desktop application
- Responsive and intuitive layout
- Similar to Oracle SQL Developer but more modern

#### SQL Editor
- Monaco Editor (VS Code's editor) with:
  - SQL syntax highlighting
  - Line numbers
  - Code completion
  - Customizable font size and family
- Save queries to file
- Execute queries with Ctrl+Enter (Cmd+Enter on Mac)

#### Results Display
- Advanced data grid with:
  - Sorting and filtering on all columns
  - Column selection and copying
  - Export to CSV, Excel, and JSON
- Individual record view with navigation controls
- Query execution time and row count display

#### Query History
- Stores last 100 queries per connection
- Search through query history
- Insert queries from history back into editor

#### Database Explorer
- Left sidebar with connection tree
- Browse tables, views, and data models
- Data models grouped by BI catalog folders
- Refresh connection objects

#### Settings
- Dark/Light theme toggle
- Customizable editor font size (10-24px)
- Multiple font family options
- All settings persist across sessions

### Coming in Version 2
- Create default data model automatically
- Create default report automatically

## Technology Stack

- **Electron** - Desktop application framework
- **React 18** - UI library with modern hooks
- **TypeScript** - Type-safe development
- **Material UI v5** - Modern component library
- **MUI DataGrid** - Advanced data table
- **Monaco Editor** - VS Code's powerful editor
- **Zustand** - Lightweight state management
- **BI Publisher Web Services** - Oracle Fusion integration
- **electron-store** - Encrypted local storage
- **Vite** - Fast build tool

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd oraclefusionsqleditor
```

2. Install dependencies:
```bash
npm install
```

## Development

To run the app in development mode:

```bash
npm run dev
```

This will:
1. Start the Vite development server (React app)
2. Build the Electron main process
3. Launch the Electron app with hot-reload

## Building

To build the application for distribution:

```bash
# Build for current platform
npm run build

# Build directory only (faster, for testing)
npm run build:dir
```

The built application will be in the `release` folder.

### Platform-specific builds:

- **macOS**: Creates .dmg and .zip files
- **Windows**: Creates NSIS installer and portable .exe
- **Linux**: Creates AppImage and .deb packages

## Usage

### First Time Setup

1. **Launch the application**
2. **Click the Connection icon** in the top toolbar
3. **Add New Connection**:
   - Connection Name: `My Oracle Fusion`
   - URL: `https://your-instance.oraclecloud.com`
   - Username: Your Oracle Fusion username
   - Password: Your password
   - (Optional) Check "Use SSO Authentication" for SSO
4. **Test Connection** to verify
5. **Save** and **Connect**

### Executing Queries

1. **Select a connection** from the sidebar
2. **Write your SQL query** in the editor:
   ```sql
   SELECT * FROM employees WHERE department = 'Engineering'
   ```
3. **Run the query**:
   - Click the Play button
   - Or press `Ctrl+Enter` (Windows/Linux) / `Cmd+Enter` (Mac)
4. **View results** in the grid below

### Working with Results

#### Table View
- **Sort**: Click column headers
- **Filter**: Use the filter icon in column headers
- **Select columns**: Click headers to select, then copy
- **Export**: Click the Export button and choose format

#### Record View
- Click the Record View icon
- Navigate through records using arrow buttons
- View all fields for a single record

### Query History

1. Click the History icon in the editor toolbar
2. Search for specific queries
3. Click any query to insert it into the editor

### Customization

1. Click the Settings icon (gear) in the toolbar
2. Adjust:
   - Theme (Dark/Light)
   - Editor font size
   - Editor font family
3. Changes are saved automatically

## Architecture

```
oraclefusionsqleditor/
├── electron/              # Electron main process
│   ├── main.ts           # Main process entry point
│   └── preload.ts        # Preload script (IPC bridge)
├── src/
│   ├── components/       # React components
│   │   ├── App.tsx      # Main app component
│   │   ├── ConnectionManager.tsx
│   │   ├── SQLEditor.tsx
│   │   ├── ResultsGrid.tsx
│   │   ├── RecordView.tsx
│   │   ├── Sidebar.tsx
│   │   ├── QueryHistory.tsx
│   │   └── SettingsDialog.tsx
│   ├── services/         # Business logic
│   │   └── biPublisherService.ts
│   ├── store/           # State management
│   │   └── appStore.ts
│   ├── styles/          # Themes and styles
│   │   └── theme.ts
│   ├── types/           # TypeScript types
│   │   ├── index.ts
│   │   └── electron.d.ts
│   └── main.tsx         # React entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Security

- **Encrypted Storage**: All credentials are encrypted using AES-256-GCM before storage
- **Context Isolation**: Electron security best practices with context isolation
- **HTTPS Only**: All connections use HTTPS
- **No Node Integration**: Renderer process has no direct Node.js access
- **Secure IPC**: Communication via secure IPC channels only

## BI Publisher Integration

This application integrates with Oracle Fusion BI Publisher using:

1. **Catalog Web Services** - For browsing the BI catalog
2. **ExternalReportWSSService** - For executing queries via data models

### Folder Structure

On first connection, the app automatically creates:
```
/Custom/NACFusionConnector/
```

This folder is used to store data models and reports for the connector.

## Troubleshooting

### Connection Issues

**Problem**: "Connection failed" error

**Solutions**:
- Verify URL ends with `oraclecloud.com`
- Check username and password
- Ensure you have network access to Oracle Fusion
- Try "Test Connection" before saving

### Query Execution Issues

**Problem**: Query doesn't execute

**Solutions**:
- Ensure you're connected to a database
- Check SQL syntax
- Verify you have permissions for the tables/views
- Check the data model exists in BI catalog

### Build Issues

**Problem**: Build fails

**Solutions**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build directories
rm -rf dist dist-electron release

# Rebuild
npm run build
```

## Contributing

This is a private project for connecting to Oracle Fusion. For questions or support, please contact the development team.

## Reference Projects

- CloudMiner: https://rite.digital/products/cloudminer/
- SQL Connect by Splash BI: https://sqlconnect.com/
- Fusion BI Migrator: https://github.com/raj-arun/fusionbimigrator

## License

MIT License - See LICENSE file for details

## Version History

### Version 1.0.0 (Current)
- Initial release
- Connection management with encryption
- SQL editor with syntax highlighting
- Results grid with export functionality
- Query history
- Dark/Light themes
- Settings customization
- BI Publisher integration

### Version 2.0.0 (Planned)
- Auto-create default data model
- Auto-create default report
- Additional data model features
