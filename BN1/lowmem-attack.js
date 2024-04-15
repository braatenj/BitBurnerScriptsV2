export async function main(ns) {
    let servers = buildServerList(ns);
    let quitting = false;

    

    while(!quitting) {
        let crackableServers = servers.filter((server) => { return server.canCrack() && server.canHack() && !server.isRooted()});
            for(let i = 0; i < crackableServers.length; i++) {
                let server = crackableServers[i];
                server.getRootAccess();
    
                await prepServer(ns, server);
            }

        
        
        if(ns.getHackingLevel() > 20) {
            quitting = true;
        }
        await ns.sleep(1000); 
    }

    ns.spawn("BN1/normal-attack.js", {threads: 1, spawnDelay: 1000});
    




}

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
        return this.requiredPorts <= getAvailableCracks(this.ns)
    }

    isPrepped() {
        return (this.isRooted() && (this.money() == this.maxMoney) && (this.security == this.minSecurity))
    }

    isRooted() {
        return this.ns.hasRootAccess(this.name);
    }


    getRootAccess() {
        if(this.canHack() && this.canCrack() && !this.isRooted()) {
            
            if(this.ns.fileExists("brutessh.exe", "home")) {
                this.ns.brutessh(this.name);
            }

            if(this.ns.fileExists("ftpcrack.exe", "home")) {
                this.ns.ftpcrack(this.name);
            }
    
            if(this.ns.fileExists("relaysmtp.exe", "home")) {
                this.ns.relaysmtp(this.name);
            }

            if(this.ns.fileExists("httpworm.exe", "home")) {
                this.ns.httpworm(this.name);
            }
    
            if(this.ns.fileExists("sqlinject.exe", "home")) {
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

    while(targets.length > 0) {
        let currentServer = targets.pop();
        if(visitedServers.includes(currentServer)) {
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

async function prepServer(ns, server) {
    let files = [
        "/lib/utils.js",
        "grow-target.js",
        "hack-target.js",
        "weaken-target.js",
        "hacking-manager.js",
        "hacknet-manager.js",
        "prep-host-stage-1.js",
        "prep-host-stage-2.js"
    ];
    await ns.scp(files, server.name, "home");

    let maxThreads = Math.floor(server.maxRam / 2.5);
    ns.exec("prep-host-stage-2.js", server.name, maxThreads);
}