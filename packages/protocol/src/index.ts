import type { BuildCommand, CitySnapshot, Overlay } from "@caesar/sim";

export type ClientMessage =
  | { type: "hello" }
  | { type: "command"; command: BuildCommand }
  | { type: "inspect"; x: number; y: number }
  | { type: "overlay"; overlay: Overlay }
  | { type: "speed"; speed: number }
  | { type: "reset" };

export type ServerMessage =
  | { type: "snapshot"; snapshot: CitySnapshot }
  | { type: "inspect"; title: string; lines: string[]; x: number; y: number }
  | { type: "error"; text: string }
  | { type: "pong" };

export type { BuildCommand, CitySnapshot, Overlay };
