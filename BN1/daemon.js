export async function main(ns) {
    ns.disableLog('ALL');

    const SCRIPT_BASE_RAM = 1.6;
    let HACK_BASE_THRESHOLD = .8;
    let HACK_MOD_THRESHOLD = HACK_BASE_THRESHOLD;
    let HACK_INC_THRESHOLD = .01;
    let HACK_MAX_THRESHOLD = .5;
    let hackHardeningPerThread = 0.002;
    let growHardeningPerThread = 0.004;
    let weakenPerThread = 0.05;
    let hackThreshold = .8;
    let script = {
        "hack": "hack-target.js",
        "weaken": "weaken-target.js",
        "grow": "grow-target.js"
    }
    
    function getAllServers() {
        let results = [];
        let visitedServers = [];
        let targets = ["home"];
    
        while(targets.length > 0) {
            let currentServer = targets.pop();
            if(visitedServers.includes(currentServer)) {
                continue;
            }
            targets.push(...ns.scan(currentServer));
            visitedServers.push(currentServer);     
        }
    
        return visitedServers;
    }

    function crackNewServers() {
        let servers = getAllServers();

        for(let server of servers) {
            if(canCrack(server) && !ns.hasRootAccess(server)) {
                doCrack(server);
            }
        }
    }

    function getServerFreeRam(server) {
        return ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
    }

    function getServersWithAvailableRam(ram = 0) {
        let servers = getAllServers();
        let results = [];

        for(let server of servers) {
            if(ns.getServerMaxRam(server) - ns.getServerUsedRam(server) > ram) {
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
     * @param {boolean} spreading can the threads be spread across multiple hosts
     * @param {boolean} partial  for loads that can be spread, is it alright to run less than the full amount of threads
     * @returns {number} on success returns 0, otherwise failure or partial success when using partial = true returns threads remaining
     */
    function runScriptOnAvailableServers(script, threads, args, spreading = false, partial = false) {
        if(threads < 1) { threads = 1 }
        let originalThreads = threads;
        let ramNeeded = 0;
        let possibleServers = [];

        //can the script be spread across servers? (usually only weaken can)
        //if not get a single server with available ram
        if(!spreading) {
            ramNeeded = threads * ns.getScriptRam(script);
            possibleServers = getServersWithAvailableRam(ramNeeded);
            if(possibleServers.length > 0) {
                let host = possibleServers[0];
                if(ns.exec(script, host, threads, args) !== 0) { return 0; }
            }
        } else {
            //if partial allowed, just start executing on servers with free ram
            if(partial) {
                ramNeeded = ns.getScriptRam(script);
                possibleServers = getServersWithAvailableRam(ramNeeded);
                for(let server of possibleServers) {
                    if(threads == 0) {return 0;}
                    let ramAvailable = getServerFreeRam(server);
                    let threadsAvailable = Math.floor(ramAvailable / ns.getScriptRam(script));
                    if(threadsAvailable >= threads) {
                        if(ns.exec(script, server, threads, args) !== 0) { return 0; }
                    } else {
                        ns.exec(script, server, threadsAvailable, args);
                        threads -= threadsAvailable;
                    }
                }
            } else {
                //do something to make sure all threads or none are fired
                let pids = [];
                let totalRamNeeded = threads * ns.getScriptRam(script);
                let totalAvailableRam = 0;
                let ramPerThread = ns.getScriptRam(script);
                possibleServers = getServersWithAvailableRam(ramPerThread);
                for(let server of possibleServers) {
                    totalAvailableRam += getServerFreeRam(server);
                }

                if(totalAvailableRam * .9 > totalRamNeeded) {
                    for(let server of possibleServers) {
                        if(threads == 0) {return 0;}
                        let ramAvailable = getServerFreeRam(server);
                        let threadsAvailable = Math.floor(ramAvailable / ns.getScriptRam(script));
                        if(threadsAvailable >= threads) {
                            if(ns.exec(script, server, threads, args) !== 0) { return 0; }
                        } else {
                            pids.push(ns.exec(script, server, threadsAvailable, args));
                            threads -= threadsAvailable;
                        }
                    }

                    ns.print("Unable to find enough space to launch all threads, killing partial scripts");
                    if(threads != 0) {
                        for(let pid of pids) {
                            ns.kill(pid);
                        }
                        return originalThreads;
                    }
                }

            }
            
        }

        return threads;

    }

    function getAvailableCracks() {
        let count = 0;
    
        if(ns.fileExists("brutessh.exe", "home")) {
            count++;
        }
    
        if(ns.fileExists("ftpcrack.exe", "home")) {
            count++;
        }
        
        if(ns.fileExists("relaysmtp.exe", "home")) {
            count++;
        }
        
        if(ns.fileExists("httpworm.exe", "home")) {
            count++;
        }
        
        if(ns.fileExists("sqlinject.exe", "home")) {
            count++;
        }
    
        return count;
    }

    function getWeakenThreads(server) {
        let serverSecurityDifference = (ns.getServerSecurityLevel(server) - ns.getServerMinSecurityLevel(server));
        return Math.ceil(serverSecurityDifference / weakenPerThread);
    }

    function getGrowThreads(server) {
        let serverMoneyAvailable = ns.getServerMoneyAvailable(server);
        let serverMaxMoney = ns.getServerMaxMoney(server);
        
        //set money available to 1 if it is 0 to prevent a divide by 0 issue in multiplier calculation
        if(serverMoneyAvailable == 0) { serverMoneyAvailable = 1 }
        

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
        let hackAmount = serverMoneyAvailable - (serverMaxMoney * threshold);
        let threads = ns.hackAnalyzeThreads(server, hackAmount);

        return Math.floor(threads);
    }

    function getNetworkRamAvailable() {
        let servers = getAllServers();
        let freeRam = 0;

        for(let server of servers) {
            let availableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
            if(availableRam > SCRIPT_BASE_RAM) {
                freeRam += availableRam;
            }
        }

        return freeRam;
    }

    function getHackTarget() {
        let servers = getAllServers();
        let possibleTargets = [];
        let hackableTargets = [];

        for(let server of servers) {
            if(ns.getServerMaxMoney(server) > 1 && (ns.getServerMaxMoney(server) == ns.getServerMoneyAvailable(server))) {
                if(ns.getServerSecurityLevel(server) == ns.getServerMinSecurityLevel(server)) {
                    let object = {
                        name: server,
                        money: ns.getServerMaxMoney(server)
                    }
    
                    possibleTargets.push(object);
                }
                
            }  
        }

        possibleTargets.sort((a, b) => {
            return a.money - b.money;
        }).reverse();

        for(let target of possibleTargets) {
            if(canHack(target.name)) {
                hackableTargets.push(target.name);
            }
        }

        if(hackableTargets.length > 0) {
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

        for(let server of servers) {
            if(ns.getServerSecurityLevel(server) > ns.getServerMinSecurityLevel(server) && ns.hasRootAccess(server)) {
                let secDiff = ns.getServerSecurityLevel(server) - ns.getServerMinSecurityLevel(server);
                let object = {
                    name: server,
                    diff: secDiff
                }
                possibleTargets.push(object);
            }
        }

        possibleTargets.sort((a, b) => {
            return a.diff - b.diff;
        });

        if(possibleTargets.length > 0) {
            return possibleTargets[0];
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

        for(let server of servers) {
            if(ns.getServerMoneyAvailable(server) < ns.getServerMaxMoney(server) && ns.getServerMaxMoney(server) > 1) {
                if(ns.getServerSecurityLevel(server) == ns.getServerMinSecurityLevel(server)) {
                    let object = {
                        name: server,
                        money: ns.getServerMaxMoney(server) / ns.getServerMoneyAvailable(server)
                    }
    
                    possibleTargets.push(object);
                }
                
            }  
        }

        possibleTargets.sort((a, b) => {
            return a.money - b.money;
        });

        if(possibleTargets.length > 0) {
            return possibleTargets[0];
        } else {
            return null;
        }
    }

    function canCrack(server) {
        return ns.getServerNumPortsRequired(server) <= getAvailableCracks() ? true : false;
    }

    function canHack(server) {
        return (ns.getServerRequiredHackingLevel(server) <= ns.getHackingLevel() && ns.hasRootAccess(server)) ? true : false;
    }

    function doCrack(server) {
        if(ns.getServerNumPortsRequired(server) <= getAvailableCracks()) {
            if(ns.fileExists("brutessh.exe", "home")) {
                ns.brutessh(server);
            }
        
            if(ns.fileExists("ftpcrack.exe", "home")) {
                ns.ftpcrack(server)
            }
            
            if(ns.fileExists("relaysmtp.exe", "home")) {
                ns.relaysmtp(server);
            }
            
            if(ns.fileExists("httpworm.exe", "home")) {
                ns.httpworm(server);
            }
            
            if(ns.fileExists("sqlinject.exe", "home")) {
                ns.sqlinject(server);
            }

            ns.nuke(server);
            let files = [
                "grow-target.js",
                "hack-target.js",
                "weaken-target.js"
            ];

            ns.scp(files, server, "home");
        }
    }



    //MAIN LOGIC START
    ns.toast("Vladburner Activated");
    while(true) {
        crackNewServers();

        let hackTarget = getHackTarget();
        let weakTarget = getWeakenTarget();

        if(hackTarget !== null) {
            if(runScriptOnAvailableServers(script.hack, getHackThreads(hackTarget, HACK_MOD_THRESHOLD), hackTarget, false, false) > 0) {
                //couldn't find enough threads for hack at default levels
                ns.print("Unable to find enough space to launch hack, reducing target amount");
                if(runScriptOnAvailableServers(script.hack, getHackThreads(hackTarget, .9), hackTarget, false, false) > 0 ){
                    //couldnt find enough threads at reduced levels
                    ns.print("Unable to find enough space with reduced target amount, defaulting to tiny hack");
                    runScriptOnAvailableServers(script.hack, 1, 'n00dles', false, false);
                }
                else {
                    //we were unable to hack at the current threshold, reset it back to baseline
                    HACK_MOD_THRESHOLD = HACK_BASE_THRESHOLD;
                }
            } else {
                //we were able to hack at the current threshold, decrease by one increment
                HACK_MOD_THRESHOLD -= HACK_INC_THRESHOLD;
                if(HACK_MOD_THRESHOLD > HACK_MAX_THRESHOLD) {
                    HACK_MOD_THRESHOLD = HACK_MAX_THRESHOLD;
                }

                //try and weaken a secondary server
                if(weakTarget !== null) {
                    runScriptOnAvailableServers(script.weaken, getWeakenThreads(weakTarget), weakTarget, true, true);
                }
                
            }
        } else if(weakTarget !== null){
            //no hacking targets, just need to grow and weaken servers
            let result = runScriptOnAvailableServers(script.weaken, getWeakenThreads(weakTarget), weakTarget, true, true );
            if(result == 0) {
                let growTarget = getGrowTarget();
                if(growTarget !== null) {
                    runScriptOnAvailableServers(script.grow, getGrowThreads(growTarget), growTarget, true, true);
                }
            }
        }

        await ns.sleep(1000);
    }


}







