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

 

  if (getCurrentBitnode(ns) == 1) {
    ns.spawn("BN1/batcherv1", { threads: 1, spawnDelay: 1500 });
  }
}
