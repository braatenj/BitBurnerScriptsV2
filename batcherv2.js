import { Game } from "./lib/lib.game";
import { Server } from "./lib/lib.server";
import { Player } from "./lib/lib.player";

/** @param {NS} ns */
export async function main(ns) {
  let game = new Game(ns);
  let player = new Player(ns, player);
}
