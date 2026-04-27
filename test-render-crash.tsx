import React from "react";
import ReactDOMServer from "react-dom/server";
import { Crash } from "./src/components/Crash";
import { Wheel } from "./src/components/Wheel";
import { DragonTower } from "./src/components/DragonTower";
import { UserProvider } from "./src/context/UserContext";

try {
  ReactDOMServer.renderToString(
    <UserProvider>
      <Crash />
    </UserProvider>
  );
  console.log("Crash rendered");
} catch (e: any) {
  console.error("Crash error:", e.message);
}
try {
  ReactDOMServer.renderToString(
    <UserProvider>
      <Wheel />
    </UserProvider>
  );
  console.log("Wheel rendered");
} catch (e: any) {
  console.error("Wheel error:", e.message);
}
try {
  ReactDOMServer.renderToString(
    <UserProvider>
      <DragonTower />
    </UserProvider>
  );
  console.log("DragonTower rendered");
} catch (e: any) {
  console.error("DragonTower error:", e.message);
}
