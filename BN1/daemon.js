export async function main(ns) {
  ns.disableLog("ALL");

  const SCRIPT_BASE_RAM = 1.6;
  //This is the percentage of max money to leave so .8 base TAKES 20% of MaxMoney
  //lowering this increases amount taken
  let HACK_BASE_THRESHOLD = 0.8;
  let HACK_MOD_THRESHOLD = HACK_BASE_THRESHOLD;
  let HACK_INC_THRESHOLD = 0.01;
  let HACK_MAX_THRESHOLD = 0.5;
  let hackHardeningPerThread = 0.002;
  let growHardeningPerThread = 0.004;
  let weakenPerThread = 0.05;
  let hackThreshold = 0.8;
  let AdvancedDaemonRamThreshold = 32;
  let script = {
    hack: "hack-target.js",
    weaken: "weaken-target.js",
    grow: "grow-target.js",
  };

  let HACKNET_NODE_LIMIT = 16;
  let HACKNET_LEVEL_LIMIT = 32;
  let HACKNET_RAM_LIMIT = 32;
  let HACKNET_CORE_LIMIT = 8;
  let HACKNET_SPEND_LIMIT = 0.1;
  let HACKNET_MANAGER_RUNNING = false;
  let SERVER_MIN_MEMORY_POWER = 5;
  let SERVER_SPEND_LIMIT = 0.1;
  let SERVER_MANAGER_RUNNING = false;

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

  function crackNewServers() {
    let servers = getAllServers();

    for (let server of servers) {
      if (canCrack(server) && !ns.hasRootAccess(server)) {
        doCrack(server);
        ns.print("");
      }
    }
  }

  function getServerRamFree(ns, server) {
    return ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
  }

  function getServersWithAvailableRam(ram = 1.6) {
    let servers = getAllServers();
    let results = [];

    for (let server of servers) {
      if (
        ns.getServerMaxRam(server) - ns.getServerUsedRam(server) > ram &&
        ns.hasRootAccess(server)
      ) {
        results.push(server);
      }
    }

    return results;
  }

  /**
   *
   * @param {string} script name of script that needs to be run
   * @param {number} threads number of threads for script, must be positive number
   * @param {string|Array} args string or array of strings for arguments
   * @param {boolean} partial  for loads that can be spread, is it alright to run less than the full amount of threads
   * @returns {number[]} on success pid, failure returns [0]
   */
  function runScript(ns, script, threads, args, partial = false) {
  //we are not allowing partial number of threads to be run, so find server that can run all at once
  if (!partial) {
    let ramNeeded = ns.getScriptRam(script, "home") * threads;
    let possibleHosts = getServersWithAvailableRam(ns, ramNeeded);

    //if there is no host with enough space, return failure
    if (possibleHosts.length === 0) {
      return [0];
    }

    let host = possibleHosts[0];

    //if the file doesn't already exist on the host, transfer it before executing it
    if (!ns.fileExists(script, host)) {
      ns.scp(script, host, "home");
    }

    let pid = ns.exec(script, host, threads, args);
    if (pid === 0) {
      return [0];
    } else {
      return [pid];
    }
  }
  //we are allowing partial threads, so launch as many as we can
  if (partial) {
    let ramNeeded = ns.getScriptRam(script, "home");
    let possibleHosts = getServersWithAvailableRam(ramNeeded);

    if (possibleHosts.length === 0) {
      return [0];
    }

    let host = possibleHosts[0];
    let threadsAvailable = Math.floor(getServerRamFree(ns, host) / ramNeeded);

    if (threadsAvailable === 0) {
      return [0];
    }

    if (!ns.fileExists(script, host)) {
      ns.scp(script, host, "home");
    }

    let pid = ns.exec(script, host, Math.min(threads, threadsAvailable), args);
    return [pid];
  }
}

  function getAvailableCracks() {
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

  function getWeakenThreads(server) {
    if (server === null) {
      return 0;
    }
    let serverSecurityDifference =
      ns.getServerSecurityLevel(server) - ns.getServerMinSecurityLevel(server);
    return Math.ceil(serverSecurityDifference / weakenPerThread);
  }

  function getGrowThreads(server) {
    if (server === null) {
      return 0;
    }
    let serverMoneyAvailable = ns.getServerMoneyAvailable(server);
    let serverMaxMoney = ns.getServerMaxMoney(server);

    //set money available to 1 if it is 0 to prevent a divide by 0 issue in multiplier calculation
    if (serverMoneyAvailable == 0) {
      serverMoneyAvailable = 1;
    }

    let multiplier = serverMaxMoney / serverMoneyAvailable;

    return Math.ceil(ns.growthAnalyze(server, multiplier));
  }
  /**
   * @param {string} server name of hack target
   * @param {number} threshold decimal value of how much money to leave, default is .8 (80%) go higher if you dont have enough threads available
   */
  function getHackThreads(server, threshold = hackThreshold) {
    let serverMoneyAvailable = ns.getServerMoneyAvailable(server);
    let serverMaxMoney = ns.getServerMaxMoney(server);
    let hackAmount = serverMoneyAvailable - serverMaxMoney * threshold;
    let threads = ns.hackAnalyzeThreads(server, hackAmount);

    return Math.floor(threads);
  }

  function getNetworkRamAvailable() {
    let servers = getAllServers();
    let freeRam = 0;

    for (let server of servers) {
      let availableRam =
        ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
      if (ns.hasRootAccess(server)) {
        freeRam += availableRam;
      }
    }

    return freeRam;
  }

  function getNetworkMaxRam() {
    let servers = getAllServers();
    let totalRam = 0;
    for (let server of servers) {
      let maxRam = ns.getServerMaxRam(server);
      if (ns.hasRootAccess(server)) {
        totalRam += maxRam;
      }
    }

    return totalRam;
  }

  function getHackTarget() {
    let servers = getAllServers();
    let possibleTargets = [];
    let hackableTargets = [];

    for (let server of servers) {
      if (
        ns.getServerMaxMoney(server) > 1 &&
        ns.getServerMaxMoney(server) == ns.getServerMoneyAvailable(server)
      ) {
        if (
          ns.getServerSecurityLevel(server) ==
          ns.getServerMinSecurityLevel(server)
        ) {
          let object = {
            name: server,
            money: ns.getServerMaxMoney(server),
          };

          possibleTargets.push(object);
        }
      }
    }

    possibleTargets
      .sort((a, b) => {
        return a.money - b.money;
      })
      .reverse();

    for (let target of possibleTargets) {
      if (canHack(target.name)) {
        hackableTargets.push(target.name);
      }
    }

    if (hackableTargets.length > 0) {
      return hackableTargets[0];
    } else {
      return null;
    }
  }

  /**
   * @return {string | null} returns string of target server, null if no target
   */
  function getWeakenTarget() {
    let servers = getAllServers();
    let possibleTargets = [];

    for (let server of servers) {
      if (
        ns.getServerSecurityLevel(server) >
          ns.getServerMinSecurityLevel(server) &&
        ns.hasRootAccess(server)
      ) {
        let secDiff =
          ns.getServerSecurityLevel(server) -
          ns.getServerMinSecurityLevel(server);
        let object = {
          name: server,
          diff: secDiff,
        };
        possibleTargets.push(object);
      }
    }

    possibleTargets.sort((a, b) => {
      return a.diff - b.diff;
    });

    if (possibleTargets.length > 0) {
      return possibleTargets[0].name;
    } else {
      return null;
    }
  }

  /**
   * @return {string | null} returns string of target server, null if no target
   */
  function getGrowTarget() {
    let servers = getAllServers();
    let possibleTargets = [];

    for (let server of servers) {
      if (
        ns.getServerMoneyAvailable(server) < ns.getServerMaxMoney(server) &&
        ns.getServerMaxMoney(server) > 1
      ) {
        if (
          ns.getServerSecurityLevel(server) ==
          ns.getServerMinSecurityLevel(server)
        ) {
          let object = {
            name: server,
            money:
              ns.getServerMaxMoney(server) / ns.getServerMoneyAvailable(server),
          };

          possibleTargets.push(object);
        }
      }
    }

    possibleTargets.sort((a, b) => {
      return a.money - b.money;
    });

    if (possibleTargets.length > 0) {
      return possibleTargets[0].name;
    } else {
      return null;
    }
  }

  function canCrack(server) {
    return ns.getServerNumPortsRequired(server) <= getAvailableCracks()
      ? true
      : false;
  }

  function canHack(server) {
    return ns.getServerRequiredHackingLevel(server) <= ns.getHackingLevel() &&
      ns.hasRootAccess(server)
      ? true
      : false;
  }

  function doCrack(server) {
    if (ns.getServerNumPortsRequired(server) <= getAvailableCracks()) {
      if (ns.fileExists("brutessh.exe", "home")) {
        ns.brutessh(server);
      }

      if (ns.fileExists("ftpcrack.exe", "home")) {
        ns.ftpcrack(server);
      }

      if (ns.fileExists("relaysmtp.exe", "home")) {
        ns.relaysmtp(server);
      }

      if (ns.fileExists("httpworm.exe", "home")) {
        ns.httpworm(server);
      }

      if (ns.fileExists("sqlinject.exe", "home")) {
        ns.sqlinject(server);
      }

      ns.nuke(server);
      let files = ["grow-target.js", "hack-target.js", "weaken-target.js"];

      ns.scp(files, server, "home");
      ns.print("Cracked Server: " + server);
    }
  }

  //MAIN LOGIC START
  ns.toast("Vladburner Activated");
  while (true) {

    crackNewServers();
    if (!HACKNET_MANAGER_RUNNING) {
      if (
        runScript(
          ns,
          "hacknet-manager.js",
          1,
          [
            HACKNET_NODE_LIMIT,
            HACKNET_LEVEL_LIMIT,
            HACKNET_RAM_LIMIT,
            HACKNET_CORE_LIMIT,
            HACKNET_SPEND_LIMIT,
          ],
          false
        ) != 0
      ) {
        HACKNET_MANAGER_RUNNING = true;
        ns.toast("Vladburner: Hacknet Manager Launched.");
      }
    }

    if(!SERVER_MANAGER_RUNNING) {
      if(runScript(ns, "server-manager.js", 1, [SERVER_MIN_MEMORY_POWER, SERVER_SPEND_LIMIT], false, false) != 0) {
        SERVER_MANAGER_RUNNING = true;
        ns.toast("Vladburner: Server Manager Launched.");
      }
    }

    let hackTarget = getHackTarget();
    let weakTarget = getWeakenTarget();
    let growTarget = getGrowTarget();

    ns.print("HackTarget: " + hackTarget);
    ns.print("weakTarget: " + weakTarget);
    ns.print("growTarget: " + growTarget);

    if(weakTarget !== null) {
      const pids = runScript(ns, script.weaken, getWeakenThreads(weakTarget), [weakTarget, 0], true);
    }

    if(growTarget != null) {
      const pids = runScript(ns, script.grow, getGrowThreads(growTarget), [growTarget, 0], true);
    }

    if(hacktarget != null) {
      const pids = runScript(ns, script.hack, getHackThreads(hackTarget, HACK_MOD_THRESHOLD), [hackTarget, 0], false);
    }

    ns.print(getNetworkRamAvailable() + " / " + getNetworkMaxRam() + "GB");
    await ns.sleep(1000 * 10);
  }
}

async function WaitPids(ns, pids) {
  if (!Array.isArray(pids)) pids = [pids];
  while (pids.some((p) => ns.isRunning(p))) {
    await ns.sleep(5);
  }
}
