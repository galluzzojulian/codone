# Codone v1.2

A Webflow Hybrid App for integrating custom code and data handling capabilities into Webflow projects. Codone provides powerful tools for:

- Managing custom code across Webflow sites
- Synchronizing pages and site data
- Enhanced development workflows with debugging tools
- Supabase integration for persistent data storage
- Advanced code editing with syntax highlighting and suggestions

## 🎉 Release v1.2

This release introduces a complete UI refresh:
- **New Branding:** Added Codone logo throughout the application
- **Typography Update:** Switched to Fira Code font for better code readability
- **Auth Screen Redesign:** Improved welcome screen with new branding
- **Navigation Updates:** Streamlined header with new logo placement
- **Consistent Styling:** Updated all logo sizes for better visual hierarchy

## 🎉 Release v1.0

This release introduces a major upgrade to the code editor:
- **Monaco Editor Integration:** Replaced the basic code editor with Monaco Editor (the same editor used in VS Code)
- **Advanced Syntax Highlighting:** Enhanced highlighting for HTML, CSS, and JavaScript
- **Intelligent Code Completion:** Context-aware suggestions for Webflow-specific code
- **Error Detection:** Real-time code validation and error reporting
- **Dark Theme:** Improved visual consistency with the rest of the application
- **Snippets:** Added Webflow-specific code snippets for common patterns

## 🎉 Release v0.9.0

This release introduces a major upgrade to the code editor:
- **Monaco Editor Integration:** Replaced the basic code editor with Monaco Editor (the same editor used in VS Code)
- **Advanced Syntax Highlighting:** Enhanced highlighting for HTML, CSS, and JavaScript
- **Intelligent Code Completion:** Context-aware suggestions for Webflow-specific code
- **Error Detection:** Real-time code validation and error reporting
- **Dark Theme:** Improved visual consistency with the rest of the application
- **Snippets:** Added Webflow-specific code snippets for common patterns

## 🎉 Release v0.8.0

This release includes several key improvements and fixes:
- **Code Adder Functional:** The core functionality for adding and managing custom code snippets is now fully operational.
- **Sitewide Editing Removed:** Removed the previous sitewide code editing feature to focus on more granular, page-specific code management.
- **File Deletion Implemented:** Users can now delete individual code files from their projects.

## 🎉 Release v0.7.0

This release focuses on fixing critical data persistence issues:
- Fixed CORS issues when saving page code changes
- Enhanced data persistence during site reauthorization (preserves custom code)
- Improved page name detection for better organization
- Better error handling and debugging for sync operations
- Fixed issues with head_code and body_code being reset during reauthorization

## 🎉 Release v0.6.0

This release includes:
- Enhanced CORS configuration for more reliable API requests
- Improved error handling for authentication flows
- Fixed data synchronization issues between Webflow and Supabase

## 🎉 Release v0.4.0

This release enhances the Page Code Manager UI with:
- Improved file selection dropdowns with search functionality
- Enhanced spacing and padding for better visual hierarchy
- Refined styling with subtle borders and rounded corners
- More cohesive design for the page selector with "Current" page indicator
- Optimized empty state placeholders for better user experience

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
