import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Mount the React app into the #root div
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
