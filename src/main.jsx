/**
 * File: admin-frontend/src/main.jsx
 *
 * Purpose:
 * Initialize the React Admin application.
 */

import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";
import "./styles/global.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element "#root" not found.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);