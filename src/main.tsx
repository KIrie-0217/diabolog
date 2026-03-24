import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import { MantineProvider, createTheme } from "@mantine/core";
import "@mantine/core/styles.css";
import "./theme.css";
import { App } from "./App";
import { Home } from "./pages/Home";
import { Competitions } from "./pages/Competitions";
import { Competition } from "./pages/Competition";
import { Players } from "./pages/Players";
import { Player } from "./pages/Player";
import { About } from "./pages/About";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";

const theme = createTheme({
  defaultRadius: "md",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMonospace: '"SF Mono", "Fira Code", "Fira Mono", monospace',
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <HashRouter>
        <Routes>
          <Route element={<App />}>
            <Route index element={<Home />} />
            <Route path="competitions" element={<Competitions />} />
            <Route path="competitions/:id" element={<Competition />} />
            <Route path="players" element={<Players />} />
            <Route path="players/:id" element={<Player />} />
            <Route path="about" element={<About />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />
          </Route>
        </Routes>
      </HashRouter>
    </MantineProvider>
  </StrictMode>
);
