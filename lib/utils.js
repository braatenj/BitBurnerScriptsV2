export class Server {
  constructor(ns, node) {
    this.ns = ns;
    this.name = node;
    this.maxMoney = ns.getServerMoneyAvailable(node);
    this.minSecurity = ns.getServerMinSecurityLevel(node);
    this.requiredPorts = ns.getServerNumPortsRequired(node);
    this.requiredHacking = ns.getServerRequiredHackingLevel(node);
    this.maxRam = ns.getServerMaxRam(node);
  }

  freeRam() {
    return this.maxRam - this.ns.getServerUsedRam(this.name);
  }

  security() {
    return this.ns.getServerSecurityLevel(this.name);
  }

  money() {
    return this.ns.getServerMoneyAvailable(this.name);
  }

  canHack() {
    return this.ns.getHackingLevel() >= this.requiredHacking;
  }

  canCrack() {
    return this.requiredPorts <= getAvailableCracks(this.ns);
  }

  isPrepped() {
    return (
      this.isRooted() &&
      this.money() == this.maxMoney &&
      this.security == this.minSecurity
    );
  }

  isRooted() {
    return this.ns.hasRootAccess(this.name);
  }

  getRootAccess() {
    if (this.canHack() && this.canCrack() && !this.isRooted()) {
      if (this.ns.fileExists("brutessh.exe", "home")) {
        this.ns.brutessh(this.name);
      }

      if (this.ns.fileExists("ftpcrack.exe", "home")) {
        this.ns.ftpcrack(this.name);
      }

      if (this.ns.fileExists("relaysmtp.exe", "home")) {
        this.ns.relaysmtp(this.name);
      }

      if (this.ns.fileExists("httpworm.exe", "home")) {
        this.ns.httpworm(this.name);
      }

      if (this.ns.fileExists("sqlinject.exe", "home")) {
        this.ns.sqlinject(this.name);
      }

      this.ns.nuke(this.name);
    }
  }
}

export function buildServerList(ns) {
  let results = [];
  let visitedServers = [];
  let targets = ["home"];

  while (targets.length > 0) {
    let currentServer = targets.pop();
    if (visitedServers.includes(currentServer)) {
      continue;
    }
    targets.push(...ns.scan(currentServer));
    results.push(new Server(ns, currentServer));
    visitedServers.push(currentServer);
  }

  return results;
}

export function getAvailableCracks(ns) {
  let count = 0;

  if (ns.fileExists("brutessh.exe", "home")) {
    count++;
  }

  if (ns.fileExists("ftpcrack.exe", "home")) {
    count++;
  }

  if (ns.fileExists("relaysmtp.exe", "home")) {
    count++;
  }

  if (ns.fileExists("httpworm.exe", "home")) {
    count++;
  }

  if (ns.fileExists("sqlinject.exe", "home")) {
    count++;
  }

  return count;
}

export function getPlayerInfo(ns) {
  return ns.getPlayer();
}

export function getPlayerMoney(ns) {
  return ns.getServerMoneyAvailable("home");
}

export function getCurrentBitnode(ns) {
  let resetInfo = ns.getResetInfo();
  return resetInfo.currentNode;
}

export function isFreshStart(ns) {
  let resetInfo = ns.getResetInfo();

  if (
    resetInfo.currentNode === 1 &&
    resetInfo.ownedAugs.size === 0 &&
    resetInfo.ownedSF.size === 0
  ) {
    return true;
  } else {
    return false;
  }
}

export function wipeServer(ns, server) {
  let files = ns.ls(server, ".js");
  files.forEach((file) => {
    ns.rm(file, server);
  });

  let count = ns.ls(server, ".js").length;

  return count == 0 ? true : false;
}

export const ONE_MINUTE = 1000 * 60;
export const FIVE_MINUTES = 1000 * 60 * 5;
export const TEN_MINUTES = 1000 * 60 * 10;
