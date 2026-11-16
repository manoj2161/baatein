import { useState } from "react";
import Home from "./pages/Home";

export default function App() {
  const [activePage, setActivePage] = useState("Home");

  return <Home activePage={activePage} setActivePage={setActivePage} />;
}
