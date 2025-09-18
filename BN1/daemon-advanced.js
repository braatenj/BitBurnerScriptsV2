/** @param {NS} ns */
export async function main(ns) {
  const hackHardeningPerThread = 0.002;
  const growHardeningPerThread = 0.004;
  const weakenPerThread = 0.05;
  const SCRIPT = {
    HACK: "hack-target.js",
    WEAK: "weaken-target.js",
    GROW: "grow-target.js",
    HACKNET: "hacknet-manager.js",
    SERVER: "server-manager.js",
  };
  const hackScriptRam = 1.7;
  const weakenScriptRam = 1.75;
  const growScriptRam = 1.75;

  let HACKNET_NODE_LIMIT = 16;
  let HACKNET_LEVEL_LIMIT = 32;
  let HACKNET_RAM_LIMIT = 32;
  let HACKNET_CORE_LIMIT = 8;
  let HACKNET_SPEND_LIMIT = 0.1;
  let HACKNET_MANAGER_RUNNING = false;
  let SERVER_MIN_MEMORY_POWER = 4;
  let SERVER_SPEND_LIMIT = 0.1;
  let SERVER_MANAGER_RUNNING = false;

  //main loop
  while (true) {
    //if the hacknet manager is not running try and launch it.
    if (!HACKNET_MANAGER_RUNNING) {
      let pid = runScript(
        ns,
        SCRIPT.HACKNET,
        1,
        [
          HACKNET_NODE_LIMIT,
          HACKNET_LEVEL_LIMIT,
          HACKNET_RAM_LIMIT,
          HACKNET_CORE_LIMIT,
          HACKNET_SPEND_LIMIT,
        ],
        false
      );

      if (pid != 0) {
        HACKNET_MANAGER_RUNNING = true;
      }
    }

    if (!SERVER_MANAGER_RUNNING) {
      let pid = runScript(
        ns,
        SCRIPT.SERVER,
        1,
        [SERVER_MIN_MEMORY, SERVER_SPEND_LIMIT],
        false
      );
      if (pid != 0) {
        SERVER_MANAGER_RUNNING = true;
      }
    }

    //start prepping servers
    let allServers = getAllServers(ns);
    for (let i = 0; i < allServers; i++) {
      let server = allServers[i];
      if (isPrepped(ns, server) || server === "home") {
        continue;
      }

      await batchPrep(ns, server);
      await sleep(5);
    }
  }
}

/* Function Definitions Declared Below */

function getAllServers(ns) {
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

function getServerRamFree(ns, serverName) {
  let server = ns.getServer(serverName);
  return server.maxRam - server.ramUsed;
}

/**
 * @returns {string[]} array of server names that have requests free space, sorted by most space to least if none empty array
 */
function getServersWithAvailableRam(ns, ramNeeded) {
  let servers = getAllServers(ns);
  let possibleServers = [];
  for (let i = 0; i < servers.length; i++) {
    let server = ns.getServer(servers[i]);
    if (getServerRamFree(ns, server.hostname) >= ramNeeded) {
      possibleServers.push(server.hostname);
    }
  }

  possibleServers.sort(
    (a, b) => getServerRamFree(ns, a) - getServerRamFree(ns, b)
  );

  return possibleServers;
}

function isPrepped(ns, target) {
  return (
    ns.getServer(target).hackDifficulty ===
      ns.getServer(target).minDifficulty &&
    ns.getServer(target).moneyAvailable === ns.getServer(target).moneyMax
  );
}

function getGrowThreads(ns, target) {
  let serverObject = ns.getServer(target);
  let threads = Math.ceil(
    ns.growthAnalyze(
      target,
      serverObject.moneyMax / serverObject.moneyAvailable
    )
  );
  return threads;
}

async function batchPrep(ns, server) {
  ns.print("INFO: Prepping " + server);
  ns.print(
    "INFO: Security is " +
      ns.getServer(server).hackDifficulty +
      " min: " +
      ns.getServer(server).minDifficulty
  );
  ns.print(
    "INFO: Money is " +
      ns.getServer(server).moneyAvailable +
      "/" +
      ns.getServer(server).moneyMax
  );

  while (!isPrepped(ns, server)) {
    let serverObject = ns.getServer(server);
    let playerObject = ns.getPlayer();

    let securityDiff = serverObject.hackDifficulty - serverObject.minDifficulty;
    let w1threads = Math.ceil(securityDiff / weakenPerThread);
    let gthreads = getGrowThreads(ns, serverObject.hostname);
    let w2threads = Math.ceil(
      (gthreads * growHardeningPerThread) / weakenPerThread
    );

    let allPids = [];

    if (w1threads > 0) {
      ns.tprintf(
        "INFO: Server security is above minimum, trying to minimize for growth"
      );
      const pids = runScript(ns, SCRIPT.WEAK, w1threads, [server, 0], true);
      allPids.push(...pids);
    }

    if (gthreads > 0) {
      ns.tprintf(
        "INFO: Server money is below max, trying to maximize for hacking"
      );
      const pids = runScript(ns, SCRIPT.GROW, gthreads, [server, 0], true);
      allPids.push(...pids);
    }

    if (w2threads > 0) {
      ns.tprintf("INFO: Reducing server security after growth");
      const pids = runScript(ns, SCRIPT.WEAK, w2threads, [server, 100], true);
      allPids.push(...pids);
    }

    await WaitPids(ns, allPids);
    await sleep(5);
  }
}

async function WaitPids(ns, pids) {
  if (!Array.isArray(pids)) pids = [pids];
  while (pids.some((p) => ns.isRunning(p))) {
    await ns.sleep(5);
  }
}

/**
 *
 * @param {string} script name of script that needs to be run
 * @param {number} threads number of threads for script, must be positive number
 * @param {string|Array} args string or array of strings for arguments
 * @param {boolean} partial  is it alright to run less than the full amount of threads
 * @returns {number[]} returns array pids of scripts executing, if unable to execute the script will return [0].
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
