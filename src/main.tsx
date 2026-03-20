import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { App } from "./App";
import { Home } from "./pages/Home";
import { Competitions } from "./pages/Competitions";
import { Competition } from "./pages/Competition";
import { Players } from "./pages/Players";
import { Player } from "./pages/Player";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider>
      <HashRouter>
        <Routes>
          <Route element={<App />}>
            <Route index element={<Home />} />
            <Route path="competitions" element={<Competitions />} />
            <Route path="competitions/:id" element={<Competition />} />
            <Route path="players" element={<Players />} />
            <Route path="players/:id" element={<Player />} />
          </Route>
        </Routes>
      </HashRouter>
    </MantineProvider>
  </StrictMode>
);
