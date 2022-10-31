import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "modern-normalize/modern-normalize.css";
import { ChakraProvider, ColorModeScript, theme } from "@chakra-ui/react";
import { SWRConfig } from "swr";

import Root from "./routes/root";
import SignIn from "./routes/signin";
import Dashboard from "./routes/dashboard";
import Transcription from "./routes/transcription";
import SignOut from "./routes/signout";
import AuthProvider, { AuthContext } from "./components/providers/AuthProvider";
import SearchProvider from "./components/providers/SearchProvider";

const router = createBrowserRouter([
  { path: "/", element: <Root /> },
  {
    path: "/signin",
    element: <SignIn />,
  },
  { path: "/signout", element: <SignOut /> },
  { path: "/dashboard", element: <Dashboard /> },
  {
    path: "/transcription",
    children: [{ path: ":url", element: <Transcription /> }],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ColorModeScript />
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <AuthContext.Consumer>
          {({ onAuthError }) => (
            <SWRConfig value={{ onError: onAuthError }}>
              <SearchProvider
                cacheTTL={parseInt(
                  process.env.REACT_APP_SEARCH_CACHE_TTL || "10"
                )}
              >
                <RouterProvider router={router} />
              </SearchProvider>
            </SWRConfig>
          )}
        </AuthContext.Consumer>
      </AuthProvider>
    </ChakraProvider>
  </React.StrictMode>
);
