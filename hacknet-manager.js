export async function main(ns) {
  //ns.args node_limit, level_limit, ram_limit, core_limit, spend_limit
  let HACKNET_NODE_LIMIT = ns.args[0];
  let HACKNET_LEVEL_LIMIT = ns.args[1];
  let HACKNET_RAM_LIMIT = ns.args[2];
  let HACKNET_CORE_LIMIT = ns.args[3];
  let HACKNET_SPEND_LIMIT = ns.args[4];

  let running = true;

  while (running) {
    if (ns.hacknet.numNodes() == HACKNET_NODE_LIMIT) {
      let allNodesMaxed = true;
      for (let i = 0; i < ns.hacknet.numNodes(); i++) {
        let node = ns.hacknet.getNodeStats(i);
        if (
          node.cores < HACKNET_CORE_LIMIT ||
          node.level < HACKNET_LEVEL_LIMIT ||
          node.ram < HACKNET_RAM_LIMIT
        ) {
          allNodesMaxed = false;
        }
      }

      if (allNodesMaxed) {
        ns.exit();
      }
    }

    if (ns.hacknet.numNodes() < HACKNET_NODE_LIMIT) {
      if (
        ns.hacknet.getPurchaseNodeCost() <
        ns.getServerMoneyAvailable("home") * HACKNET_SPEND_LIMIT
      ) {
        ns.hacknet.purchaseNode();
      }
    }

    for (let i = 0; i < ns.hacknet.numNodes(); i++) {
      let node = ns.hacknet.getNodeStats(i);
      if (node.level < HACKNET_LEVEL_LIMIT) {
        if (
          ns.hacknet.getLevelUpgradeCost(i) <
          ns.getServerMoneyAvailable("home") * HACKNET_SPEND_LIMIT
        ) {
          ns.hacknet.upgradeLevel(i);
        }
      }

      if (node.cores < HACKNET_CORE_LIMIT) {
        if (
          ns.hacknet.getCoreUpgradeCost(i) <
          ns.getServerMoneyAvailable("home") * HACKNET_SPEND_LIMIT
        ) {
          ns.hacknet.upgradeCore(i);
        }
      }

      if (node.ram < HACKNET_RAM_LIMIT) {
        if (
          ns.hacknet.getRamUpgradeCost(i) <
          ns.getServerMoneyAvailable("home") * HACKNET_SPEND_LIMIT
        ) {
          ns.hacknet.upgradeRam(i);
        }
      }
    }

    await ns.sleep(1000 * 60);
  }
}
