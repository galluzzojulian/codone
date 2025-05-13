# Codone v0.3.0

A Webflow Hybrid App for integrating custom code and data handling capabilities into Webflow projects. Codone provides powerful tools for:

- Managing custom code across Webflow sites
- Synchronizing pages and site data
- Enhanced development workflows with debugging tools
- Supabase integration for persistent data storage

## 🎉 Release v0.3.0

This release adds:
- Page file management for custom code injection
- Ability to assign code files to page head and body sections
- Drag-and-drop reordering of file sequences
- Automatic current page detection with Webflow API
- Enhanced error handling and logging

## 🎉 Release v0.1.0

This initial release includes:
- Secure authentication with Webflow sites
- Ability to sync pages with Supabase for persistent storage
- Basic framework for custom code management

## 🚀 Quick Start

1. Clone this repository and install the dependencies:

   ```bash
   npm install
   ```

2. Navigate to the `/data-client` folder and create a `.env` file with your Webflow app credentials:

   ```env
   WEBFLOW_CLIENT_ID=xxx
   WEBFLOW_CLIENT_SECRET=xxx
   DESIGNER_EXTENSION_URI=xxx
   PORT=3000
   ```

3. Add your Supabase credentials to the `.env` file:

   ```env
   SUPABASE_URL=xxx
   SUPABASE_KEY=xxx
   ```

4. Run the Data Client and Designer Extension together:

   ```bash
   npm run dev
   ```

5. Install your app by navigating to `http://localhost:3000` in your web browser.

6. Open your Webflow Site, access the Apps panel, and click on Codone. Click "Launch Development App" and authorize to begin using the app.

## 🛠️ Tech Stack

- **Backend (Data Client):**
  - [Next.js](https://nextjs.org/) for API routes and server-side functionality
  - [Webflow SDK](https://github.com/webflow/js-webflow-api) for Webflow API integration
  - [Supabase](https://supabase.com/) for data persistence

- **Frontend (Designer Extension):**
  - [React](https://reactjs.org/) with [Vite](https://vitejs.dev/) for a fast development experience
  - [Material UI](https://mui.com/) for component styling
  - [Webflow Designer API](https://www.npmjs.com/package/@webflow/designer-extension-typings) for Designer interactions

## 🔍 Features

- **Custom Code Management:** Create, update and manage custom code across multiple pages
- **Page Synchronization:** Keep pages in sync with your development workflow
- **Development Tools:** Debug your Webflow site with enhanced developer tools
- **Persistent Storage:** Store site settings and configurations in Supabase
- **Multi-Site Support:** Manage multiple Webflow sites from a single interface

## 📁 Project Structure

```
.
├── data-client/                    # Backend server
│   ├── app/
│   │   ├── api/                   # API Routes
│   │   │   ├── auth/             # Auth endpoints
│   │   │   ├── pages/            # Page management endpoints
│   │   │   ├── sites/            # Site management
│   │   │   └── supabase-sites/   # Supabase integration
│   │   ├── dashboard/            # Dashboard UI
│   │   ├── lib/                  # Server utilities
│   │   └── page.tsx              # Main landing page
│
├── designer-extension/            # Frontend app
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── CustomCode/       # Custom code management UI
│   │   │   └── DevTools/         # Developer tools UI
│   │   ├── hooks/                # Custom React hooks
│   │   └── App.tsx               # Main app component
```

## 📚 License

This project is licensed under the MIT License.
