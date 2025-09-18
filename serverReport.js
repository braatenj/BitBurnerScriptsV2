/** @param {NS} ns */
export async function main(ns) {
  let target = ns.args[0];
  ns.ui.clearTerminal();

  if (target === "ALL") {
    let servers = getAllServers();
    let row = "%-20s | %-15s | %-15s | %-10t | %-10t";
    let rowHeader = "%-20s | %-15s | %-15s | %-10s | %-10s";
    ns.tprintf(rowHeader, "Hostname", "Money", "Security", "Root", "Backdoor");
    ns.tprintf(
      "--------------------------------------------------------------------------------"
    );
    for (let i = 0; i < servers.length; i++) {
      let server = ns.getServer(servers[i]);
      let moneyString =
        ns.formatNumber(server.moneyAvailable, 2) +
        "/" +
        ns.formatNumber(server.moneyMax, 2);
      let securityString =
        ns.formatNumber(server.hackDifficulty, 2) +
        "/" +
        ns.formatNumber(server.minDifficulty, 2);
      ns.tprintf(
        row,
        server.hostname,
        moneyString,
        securityString,
        server.hasAdminRights,
        server.backdoorInstalled
      );
    }
  } else {
    let server = ns.getServer(target);

    ns.tprintf("");
    ns.tprintf("Hostname: %s", server.hostname);
    ns.tprintf(
      "Money: %s/%s",
      ns.formatNumber(server.moneyAvailable, 2),
      ns.formatNumber(server.moneyMax, 2)
    );
    ns.tprintf(
      "Security: %s/%s",
      ns.formatNumber(server.hackDifficulty, 2),
      ns.formatNumber(server.minDifficulty, 2)
    );
    ns.tprintf("Root Access: %s", server.hasAdminRights);
    ns.tprintf("Backdoor Installed: %s", server.backdoorInstalled);
  }

  function getAllServers() {
    let results = [];
    let visitedServers = [];
    let targets = ["home"];

    while (targets.length > 0) {
      let currentServer = targets.pop();
      if (visitedServers.includes(currentServer)) {
        continue;
      }
      targets.push(...ns.scan(currentServer));
      visitedServers.push(currentServer);
    }

    return visitedServers;
  }
}
