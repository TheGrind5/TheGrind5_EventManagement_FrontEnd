import React from "react";
import ReactDOM from "react-dom/client";
import './index.css';
import App from "./App";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { OAUTH_CONFIG } from './config/oauth';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={OAUTH_CONFIG.google.clientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
