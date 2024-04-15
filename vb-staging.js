import { getPlayerInfo, getPlayerMoney, getCurrentBitnode, isFreshStart, wipeServer } from "./lib/utils.js"

export async function main(ns) {
    ns.disableLog(`ALL`);
    ns.print(`Initializing Vladburner fully automated scripts...`);
    ns.print(`Retrieving latest scripts.`);

    

    if(getCurrentBitnode(ns) == 1 && isFreshStart(ns)) {
        ns.print(`No previous bitnode detected. Initializing "Fresh Start" protocol...`);
        ns.spawn("BN1/lowmem-attack.js", {threads: 1, spawnDelay: 1500});

    }
}