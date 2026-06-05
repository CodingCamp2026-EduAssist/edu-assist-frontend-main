# Edu Assist Frontend

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📖 Project Overview

**Edu Assist** is a sophisticated, interactive web application tailored to help students seamlessly manage their academic activities, organize documents, and get real-time personalized assistance from an AI. 

The frontend is built using **React** and bundled with **Vite** for incredibly fast development builds. It interfaces with a robust backend API, providing cutting-edge features like **Server-Sent Events (SSE)** for real-time AI response streaming, custom markdown rendering with code highlighting, and intuitive document management for Retrieval-Augmented Generation (RAG).

## ✨ Key Features & Architecture

### 1. Real-Time AI Streaming Chat
At the core of Edu Assist is the AI chat interface. Rather than waiting for the complete response to generate on the server, the frontend utilizes **Server-Sent Events (SSE)** to stream the AI's response chunk-by-chunk. This significantly reduces perceived latency and mimics a human-like typing effect. 
- **Thinking Blocks:** The UI captures special "thinking" events from the AI, displaying a collapsible "Thought process" block that shows the AI's reasoning step-by-step before the actual response arrives.
- **Custom Markdown Renderer:** Responses are parsed through a custom React markdown component (`src/pages/ChatPage.jsx`) that handles bolding, lists, headings, and beautifully styles code blocks with syntax labeling.

### 2. Document & Context Management (RAG)
Users can upload documents (PDFs, docs) to provide context to the AI.
- The `SourcesSidebar` allows users to manage their uploaded documents.
- Selected documents are sent as `attachmentPaths` during the chat request, allowing the AI to pull specific contextual information from the user's materials.

### 3. Profile & Personalization
A robust personalization engine collects user details (academic level, major, specific goals) to prompt the AI effectively. Users can view and manage their preferences directly from the dashboard.

### 4. Efficient State Management
To ensure a snappy and responsive user experience without prop drilling, the application uses **Zustand** across multiple domains:
- `chat-store.js`: Manages local chat history, UI themes (light/dark mode), and active sessions. History is intelligently persisted to `localStorage`.
- `auth-store.js`: Securely manages user authentication states and tokens.
- `sources-store.js`: Tracks the currently uploaded documents and which files are actively selected as context for the AI.

## 📡 Deep Dive: How the Streaming Architecture Works

The streaming implementation is custom-built using the native `fetch` API, providing precise control over the incoming data stream and cancellation processes.

1. **The Request (`src/services/api.js`)**: 
   The `streamMessage` function initiates a `POST` request to the backend with `Accept: "text/event-stream"`. It passes user messages and selected `attachmentPaths`.
2. **Stream Reading & Decoding**: 
   The response body is accessed via `response.body.getReader()`. A `TextDecoder` reads the Uint8Array chunks into text buffers as they arrive over the wire.
3. **SSE Parsing**: 
   The text buffer is split by line breaks. The parser looks for the `data:` prefix (standard SSE format). It handles `[DONE]` signals to cleanly terminate the stream, or attempts to `JSON.parse()` the chunk payload.
4. **UI Dispatch (`src/pages/ChatPage.jsx`)**:
   The parsed chunk triggers the `onChunk` callback. 
   - If `chunk.type === "thinking"`, the text is routed to a specialized `thinkingBuffer` and rendered inside the `ThinkingBlock` UI.
   - If it's standard text, it concatenates into the main `assistantResponse` and updates the local React state, forcing a re-render of the specific message bubble.
5. **Auto-Scrolling**: 
   A `useEffect` hook tied to the `messages` state ensures the chat window smoothly auto-scrolls to the bottom using `scrollIntoView()` as new chunks push the text downwards.
6. **Graceful Cancellation**:
   An `AbortController` handles request timeouts and user-initiated cancellations. If the stream takes too long or errors out, the controller triggers an abort, gracefully notifying the user through the `onError` callback without crashing the app.

## 🛠️ Tech Stack

- **React 18** – UI library (Functional components & Hooks)
- **Vite** – Next-generation frontend tooling and bundler
- **Zustand** – Lightweight, flux-like state management and persistence
- **Tailwind CSS** – Utility-first CSS framework for rapid UI styling
- **Axios & Fetch API** – HTTP clients for REST API interaction and SSE streaming
- **pnpm** – Fast, disk space efficient package manager (Highly recommended over npm/yarn for this monorepo structure)
- **Lucide React** – Beautiful, consistent SVG icons

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or later)
- **pnpm** (version 9+ recommended). If you don't have it installed, run:
  ```bash
  npm install -g pnpm
  ```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/akunadila/edu-assist-frontend-main.git
cd edu-assist-frontend-main

# 2. Install dependencies strictly using pnpm
pnpm install
```

### Environment Setup

Create a `.env` file in the root of the project and define your environment variables:
```env
VITE_API_BASE_URL=http://localhost:3000  # Or your deployed backend URL
```

### Running the Development Server

```bash
# Start the Vite development server
pnpm dev
```
The application will be accessible at `http://localhost:5173`.

## 📂 Project Structure

```
src/
├─ assets/              # Static assets (images, global CSS)
├─ components/          # Reusable UI components
│  ├─ ProfileSection.jsx  # User profile management UI
│  ├─ HistoryPanel.jsx    # Sidebar for previous chat sessions
│  └─ SourcesSidebar.jsx  # RAG document upload and selection UI
├─ hooks/               # Custom React hooks (e.g., useSSE)
├─ pages/               # Top-level route components
│  ├─ ChatPage.jsx        # Main streaming chat interface
│  └─ PersonalizationPage # User preference onboarding
├─ services/            # API interaction logic
│  ├─ api.js              # Core API fetch functions (streaming, auth, etc.)
│  └─ axiosInstance.js    # Pre-configured Axios client with interceptors
└─ store/               # Zustand global state modules
   ├─ auth-store.js
   ├─ chat-store.js
   └─ sources-store.js
```

## 🤝 Contributing

Contributions are highly encouraged! To maintain code quality and consistency:

1. Fork the project.
2. Create your feature branch (`git checkout -b feat/AmazingFeature`).
3. Ensure your code follows the existing formatting (we use ESLint & Prettier).
4. Commit your changes. (We prefer prefixing commits with `[FEAT]`, `[FIX]`, or `[REFACT]`).
5. Push to the branch (`git push origin feat/AmazingFeature`).
6. Open a Pull Request.

## 📄 License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---
*Built with ❤️ for better education.*
