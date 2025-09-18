import {
  getPlayerInfo,
  getPlayerMoney,
  getCurrentBitnode,
  isFreshStart,
  wipeServer,
} from "./lib/utils.js";

export async function main(ns) {
  ns.disableLog(`ALL`);
  ns.print(`Initializing Vladburner fully automated scripts...`);

  if (getCurrentBitnode(ns) == 1 && ns.getServer("home").maxRam() > 32) {
    ns.spawn("BN1/daemon-advanced.js", { threads: 1, spawnDelay: 1500 });
  }

  if (getCurrentBitnode(ns) == 1) {
    ns.spawn("BN1/daemon.js", { threads: 1, spawnDelay: 1500 });
  }
}
