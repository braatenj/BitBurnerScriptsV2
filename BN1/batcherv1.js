
const ACTIONS = ['hack', 'hWeaken', 'grow', 'gWeaken'];
const SCRIPTS = { hack: 'hack-target.js', hWeaken: 'weaken-target.js', grow: 'grow-target.js', gWeaken: 'weaken-target.js' };
const WORKERS = ['hack-target.js', 'weaken-target.js', 'grow-target.js'];
const OFFSETS = { hack: 0, hWeaken: 1, grow: 2, gWeaken: 3 };
const COSTS = { hack: 1.7, hWeaken: 1.75, grow: 1.75, gWeaken: 1.75 };
const CRACKS = ['brutessh.exe', 'ftpcrack.exe', 'relaysmtp.exe', 'httpworm.exe', 'sqlinject.exe'];




/** @param {NS} ns */
export async function main(ns) {
    //define some values to be used in the program
    let HACKNET_NODE_LIMIT = 16;
  let HACKNET_LEVEL_LIMIT = 32;
  let HACKNET_RAM_LIMIT = 32;
  let HACKNET_CORE_LIMIT = 8;
  let HACKNET_SPEND_LIMIT = 0.05;
  let HACKNET_MANAGER_RUNNING = false;
  let SERVER_MIN_MEMORY_POWER = 5;
  let SERVER_SPEND_LIMIT = 0.1;
  let SERVER_MANAGER_RUNNING = false;


    ns.disableLog('ALL');
    let game = new Game(ns);
    getAllServers(ns, true);
    while (true) {
        crackNewServers(ns);

        if(game.getNextBatchID() % 200 == 0) {
            await ns.sleep(1000 * 60);
        }
        

        if(!SERVER_MANAGER_RUNNING) {
                let snapshot = new RamSnapshot(ns, getAllServers(ns));
        let pRam = snapshot.copyBlocks();
        for(const block of pRam) {
            if(block.ram > 5.35) {
                ns.scp("server-manager.js", block.server, "home");
                let pid = ns.exec("server-manager.js", block.server, 1);
                if(pid != 0) {
                    SERVER_MANAGER_RUNNING = true;
                    break;
                }
            }
        }
        }

        if(!HACKNET_MANAGER_RUNNING) {
            //TODO put code here to launch hacknet manager
        }
        //get target for batch, hardcoded for right now
        let target = 'n00dles'
        //if target is not prepped, prep it
        while (!isPrepped(ns, target)) {
            ns.tprintf('Prepping %s', target);
            let snapshot = new RamSnapshot(ns, getAllServers(ns));
            let batchDetails = new BatchDetails(ns, target, game.getNextBatchID());
            batchDetails.update();
            //calculate threads and associated ram cost to bring to min security before growing target
            let secDiff = ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target);
            let w1threads = Math.max(Math.ceil(secDiff / .05), 1);


            //calculate how many grow threads we will need
            let multiplier = ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target);
            let gthreads = Math.max(Math.ceil(ns.growthAnalyze(target, multiplier)), 1);


            //calculate how many weaken threads after growing are needed
            let gSecDiff = gthreads * .004;
            let w2threads = Math.max(Math.ceil(gSecDiff / .05), 1);


            //update batchDetails with thread counts for actions
            batchDetails.threads['hWeaken'] = w1threads;
            batchDetails.threads['grow'] = gthreads;
            batchDetails.threads['gWeaken'] = w2threads;

            //update batchDetails with endTimes for actions
            batchDetails.endTime['hWeaken'] = performance.now() + batchDetails.weakTime + batchDetails.jobBuffer * OFFSETS['hWeaken'] + 1000;
            batchDetails.endTime['grow'] = performance.now() + batchDetails.weakTime + batchDetails.jobBuffer * OFFSETS['grow'] + 1000;
            batchDetails.endTime['gWeaken'] = performance.now() + batchDetails.weakTime + batchDetails.jobBuffer * OFFSETS['gWeaken'] + 1000;

            //check to see if current ram snapshot has a block that supports running all these threads
            let pRam = snapshot.copyBlocks();

            for (const block of pRam) {
                while (block.ram >= 1.75) {
                    await ns.sleep(5)
                    if (w1threads == 0 && gthreads == 0 && w2threads == 0) break;
                    const blockMaxThreads = block.ram / 1.75;
                    if (w1threads != 0) {
                        let threads = Math.min(w1threads, blockMaxThreads);
                        const job = new Job(ns, 'hWeaken', batchDetails, block.server);
                        let pid = ns.exec(SCRIPTS[job.action], job.host, { threads: threads, temporary: true }, JSON.stringify(job));
                        if (pid != 0) {
                            w1threads -= threads;
                            ns.tprintf('Launched w1 batch, %d threads remaining', w1threads);
                        }

                        continue;
                    }

                    if (gthreads != 0) {
                        let threads = Math.min(gthreads, blockMaxThreads);
                        const job = new Job(ns, 'grow', batchDetails, block.server);
                        let pid = ns.exec(SCRIPTS[job.action], job.host, { threads: threads, temporary: true }, JSON.stringify(job));
                        if (pid != 0) {
                            gthreads -= threads;
                            ns.tprintf('Launched grow batch, %d threads remaining', gthreads);
                        }
                        continue;
                    }

                    if (w2threads != 0) {
                        let threads = Math.min(w2threads, blockMaxThreads);
                        const job = new Job(ns, 'gWeaken', batchDetails, block.server);
                        let pid = ns.exec(SCRIPTS[job.action], job.host, { threads: threads, temporary: true }, JSON.stringify(job));
                        if (pid != 0) {
                            w2threads -= threads;
                            ns.tprintf('Launched w2 batch, %d threads remaining', w2threads);
                        }
                        continue;
                    }

                    await ns.sleep(5);
                }
            }

            await ns.sleep(batchDetails.endTime['gWeaken'] - performance.now());
        }


        //now that the target is prepped, launch an attack batch against them
        scheduleBatch(ns, target, game);

        await ns.sleep(500);
    }


}



class Job {
    constructor(ns, action, batchDetails, host = 'none') {
        this.host = host;
        this.action = action;
        this.endTime = batchDetails.endTime[action];
        this.runTime = batchDetails.runTime[action];
        this.target = batchDetails.target;
        this.threads = batchDetails.threads[action];
        this.cost = this.threads * COSTS[action];
        this.port = batchDetails.port;
        this.batchId = batchDetails.batchId;

    }
}

class BatchDetails {
    constructor(ns, server, batchId) {
        this.ns = ns; //carry a copy of NS so we can pass it along
        //values that are keyed to the job action
        this.runTime = { hack: 0, hWeaken: 0, grow: 0, gWeaken: 0 };
        this.endTime = { hack: 0, hWeaken: 0, grow: 0, gWeaken: 0 };
        this.threads = { hack: 0, hWeaken: 0, grow: 0, gWeaken: 0 };

        this.target = server;
        this.maxMoney = ns.getServerMaxMoney(server);
        this.money = Math.max(ns.getServerMoneyAvailable(server), 1);
        this.minSecurity = ns.getServerMinSecurityLevel(server);
        this.security = ns.getServerSecurityLevel(server);
        this.weakTime = ns.getWeakenTime(server)
        this.prepped = isPrepped(ns, server); //is the server this batch is targeting prepped?
        this.greed = 0.1; //how much of the servers money are we taking, default to low value, will calculate with function later
        this.jobBuffer = 15 //how many msec between each job finishing
        //things to add/use in the future
        this.hackChance = 0;
        this.port = ns.pid; //grab a port using the scripts pid to communicate back when a worker is done
        this.batchId = batchId;
    }

    update(greed = this.greed) {
        this.money = this.ns.getServerMoneyAvailable(this.target);
        this.security = this.ns.getServerSecurityLevel(this.target);
        this.prepped = isPrepped(this.ns, this.target);
        //update timings of each action
        this.weakTime = this.ns.getWeakenTime(this.target);
        this.runTime.gWeaken = this.weakTime;
        this.runTime.hWeaken = this.weakTime;
        this.runTime.hack = this.weakTime / 4;
        this.runTime.grow = this.weakTime * .8;
        //update thread counts
        const amount = this.maxMoney * greed;
        const hThreads = Math.max(Math.floor(this.ns.hackAnalyzeThreads(this.target, amount)), 1);
        const gThreads = Math.ceil(this.ns.growthAnalyze(this.target, (this.maxMoney / (this.maxMoney - (this.maxMoney * greed)))));
        this.threads.hack = hThreads;
        this.threads.grow = gThreads;
        this.threads.hWeaken = Math.max(Math.ceil(hThreads * .002 / .05), 1);
        this.threads.gWeaken = Math.max(Math.ceil(gThreads * .004 / .05), 1);
    }

    print() {
        this.ns.tprintf('Target: %s hackRunTime: %d growRunTime: %d weakRunTime: %d hackEndTime: %d, hWeakenEndTime: %d, growEndTime: %d, gWeakenEndTime: %d', this.target, this.runTime.hack, this.runTime.grow, this.weakTime, this.endTime.hack, this.endTime.hWeaken, this.endTime.grow, this.endTime.gWeaken);
    }
}

class RamSnapshot {
    #blocks = []; //objects {server: name, ram: ramAvailable}
    #minSizeBlock = Infinity;
    #maxSizeBlock = 0;
    #totalRamAvailable = 0;
    #totalRamMax = 0;
    #index = new Map();
    constructor(ns, servers) {
        for (const server of servers) {
            if (ns.hasRootAccess(server)) {
                let maxRam = ns.getServerMaxRam(server);
                let freeRam = maxRam - ns.getServerUsedRam(server);
                //only count it if there is enough free space to run a script (smallest worker script is 1.7GB for hack)
                if (freeRam >= 1.7) {
                    //create the block and push it into the list of blocks
                    const block = { server: server, ram: freeRam };
                    this.#blocks.push(block);
                    //update min and max block sizes in snapshot
                    if (block.ram < this.#minSizeBlock) { this.#minSizeBlock = block.ram }
                    if (block.ram > this.#maxSizeBlock) { this.#maxSizeBlock = block.ram }
                    //update total ram sizes in snapshot
                    this.#totalRamAvailable += block.ram;
                    this.#totalRamMax += maxRam;
                }
            }
        }
        //call the sort function to arrange the blocks
        this.#sort();
        //build the index to use in the future for looking up server blocks buy name
        this.#blocks.forEach((block, index) => { this.#index.set(block.server, index) });
    }

    #sort() {
        //this function sorts them smallest to largest, but puts home at the end with the large blocks regardless of freespace so it hopefully doesn't grabbed unless necessary
        this.#blocks.sort((a, b) => {
            if (a.server === 'home') return 1;
            if (b.server === 'home') return -1;

            return a.ram - b.ram;
        });
    }

    get minSizeBlock() {
        return this.#minSizeBlock;
    }

    get maxSizeBlock() {
        return this.#maxSizeBlock;
    }

    get totalRamAvailable() {
        return this.#totalRamAvailable;
    }

    get totalRamMax() {
        return this.#totalRamMax;
    }

    getBlock(server) {
        if (this.#index.has(server)) {
            return this.#blocks[this.#index.get(server)];
        } else {
            throw new Error(`Unable to find block for server: ${server}`);
        }
    }

    assignJob(job) {
        const block = this.#blocks.find(block => block.ram >= job.cost);
        if (block) {
            job.host = block.server;
            block.ram -= job.cost;
            this.#totalRamAvailable -= job.cost;
            return true;
        }
        return false;
    }

    finishJob(job) {
        const block = getBlock(job.host);
        block.ram += job.cost;
        this.#totalRamAvailable += job.cost;
    }

    //get a copy of the blocks in the snapshot to do calculations without messing up the data
    copyBlocks() {
        return this.#blocks.map(block => ({ ...block }));
    }

    printBlocks(ns) {
        for (const block of this.#blocks) {
            ns.tprint(block);
        }
    }


}

class Game {
    #batchId = 0;
    constructor(ns, batchId = 0) {
        this.#batchId = batchId;
    }

    getNextBatchID() {
        return this.#batchId++;
    }
}

function getAllServers(ns, copyFiles = false) {
    let visitedServers = [];
    let currentServers = ["home"];

    while (currentServers.length > 0) {
        let server = currentServers.pop();
        if (!visitedServers.includes(server)) {
            visitedServers.push(server);
            if (copyFiles) copyWorkerScripts(ns, server);

            currentServers.push(...ns.scan(server));
        }
    }

    return visitedServers;
}

function isPrepped(ns, target) {
    return ns.getServerMoneyAvailable(target) === ns.getServerMaxMoney(target) &&
        ns.getServerSecurityLevel(target) === ns.getServerMinSecurityLevel(target)
}

function copyWorkerScripts(ns, server) {
    ns.scp(WORKERS, server, "home");
}

function canCrack(ns, server) {
    let cracks = 0;
    for (const crack of CRACKS) {
        if (ns.fileExists(crack)) cracks++;
    }

    if (cracks >= ns.getServerNumPortsRequired(server)) return true;
    return false;
}


function crackNewServers(ns) {
    let servers = getAllServers(ns, true);
    for (const server of servers) {
        //if we already rooted it, dont try again
        if (ns.hasRootAccess(server)) continue;
        if (canCrack(ns, server)) {
            if (ns.fileExists('brutessh.exe', 'home')) ns.brutessh(server);
            if (ns.fileExists('ftpcrack.exe', 'home')) ns.ftpcrack(server);
            if (ns.fileExists('relaysmtp.exe', 'home')) ns.relaysmtp(server);
            if (ns.fileExists('httpworm.exe', 'home')) ns.httpworm(server);
            if (ns.fileExists('sqlinject.exe', 'home')) ns.sqlinject(server);
            ns.nuke(server);
        }
    }
}

function scheduleBatch(ns, target, game) {
    let snapshot = new RamSnapshot(ns, getAllServers(ns));
    let batchDetails = new BatchDetails(ns, target, game.getNextBatchID())
    batchDetails.update();
    let batch = [];

    for (const action of ACTIONS) {
        //update batchDetails with endTimings
        batchDetails.endTime[action] = performance.now() + batchDetails.weakTime + batchDetails.jobBuffer * OFFSETS[action] + 100;
        const job = new Job(ns, action, batchDetails);
        if (!snapshot.assignJob(job)) {
            ns.printf('Unable to assign job to block. %s', JSON.stringify(job));
            return;
        }
        batch.push(job);
    }

    for (const job of batch) {
        ns.exec(SCRIPTS[job.action], job.host, { threads: job.threads, temporary: true }, JSON.stringify(job));
    }
}