import { defineMcp } from "@lovable.dev/mcp-js";
import listGamesTool from "./tools/list-games";

export default defineMcp({
  name: "gameplay-nalchik-mcp",
  title: "GamePlay Nalchik MCP",
  version: "0.1.0",
  instructions:
    "Tools for GamePlay Nalchik — a PlayStation console rental service in Nalchik. Use `list_games` to retrieve the current catalog of games available for rent.",
  tools: [listGamesTool],
});
