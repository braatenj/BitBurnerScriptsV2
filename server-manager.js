export async function main(ns) {
  let serverPrefix = "pserv";
  let baseRam = ns.args[0];
  let maxRam = ns.getPurchasedServerMaxRam();
  let spendLimit = ns.args[1];
  let serverLimit = ns.getPurchasedServerLimit();

  while (true) {
    let purchasedServers = ns.getPurchasedServers();
    if (purchasedServers.length < serverLimit) {
      if (getLargestPurchasableServer(ns) >= baseRam) {
        baseRam = getLargestPurchasableServer(ns, spendLimit);
        ns.purchaseServer(serverPrefix, getLargestPurchasableServer(ns, spendLimit));
      }
    }

    ns.print("Will check again in 10 minutes.");
    await ns.sleep(1000 * 60 * 10);
  }
}

function getLargestPurchasableServer(ns, spendLimit) {
  let maxSpend = ns.getServerMoneyAvailable("home") * spendLimit;
  let ramAfforded = 0;
  for (let i = baseRamPower; i <= 20; i++) {
    let ram = 2 ** i;
    let serverCost = ns.getPurchasedServerCost(ram);
    if (serverCost <= maxSpend) {
      ramAfforded = ram;
    }
  }

  return ramAfforded;
}
