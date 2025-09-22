export async function main(ns) {
  ns.disableLog('ALL');
  let serverPrefix = "pserv";
  let baseRam = ns.args[0];
  let maxRam = ns.getPurchasedServerMaxRam();
  let spendLimit = ns.args[1];
  let serverLimit = ns.getPurchasedServerLimit();
  ns.printf("Starting Server Manager, base ram: %s, spend limit: %d, MoneyToSpend: %s", ns.formatRam(baseRam), spendLimit, ns.formatNumber(ns.getServerMoneyAvailable('home') * spendLimit));

  while (true) {
    let purchasedServers = ns.getPurchasedServers();
    if (purchasedServers.length < serverLimit) {
      ns.print('Not at limit for purchased servers. Checking if we can purchase one larger than our smallest');
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
  ns.printf('MaxSpend: %d', ns.formatNumber(maxSpend));
  let ramAfforded = 0;
  for (let i = 0; i <= 20; i++) {
    let ram = 2 ** i;
    ns.printf('Checking Ram: %d', ram);
    let serverCost = ns.getPurchasedServerCost(ram);
    if (serverCost <= maxSpend) {
      
      ramAfforded = ram;
      ns.printf('Found Affordable Server - Ram: %s Cost: %s MaxSpend: %s', ns.formatRam(ramAfforded), ns.formatNumber(serverCost), ns.formatNumber(spendLimit));
    }
  }
  
  return ramAfforded;
}
