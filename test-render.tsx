import React from "react";
import ReactDOMServer from "react-dom/server";
import { Wheel } from "./src/components/Wheel";
import { DragonTower } from "./src/components/DragonTower";
import { UserProvider } from "./src/context/UserContext";

try {
  const html1 = ReactDOMServer.renderToString(
    <UserProvider>
      <Wheel />
    </UserProvider>
  );
  console.log("Wheel rendered successfully");
} catch (e: any) {
  console.error("Wheel crash:", e.message, e.stack);
}

try {
  const html2 = ReactDOMServer.renderToString(
    <UserProvider>
      <DragonTower />
    </UserProvider>
  );
  console.log("DragonTower rendered successfully");
} catch (e: any) {
  console.error("DragonTower crash:", e.message, e.stack);
}
