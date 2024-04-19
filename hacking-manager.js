import { Server, buildServerList, ONE_MINUTE, FIVE_MINUTES, TEN_MINUTES } from "./lib/utils"


export async function main(ns) {
    let servers = buildServerList(ns);

    
    while(true) {
        let targets = getCrackingTargets(servers);

        for(let i = 0; i < targets.length; i++) {
            let target = targets[i];
            target.getRootAccess();
            await prepServer(target);
        }

        let bestTarget = retrieveBestHackTarget(ns, servers);

        await ns.sleep(ONE_MINUTE);
    }

}

function getCrackingTargets(servers) {
    let results = servers.filter((server) => {
        return (server.canHack() && server.canCrack() && !server.isRooted())
    })
}

async function prepServer(server) {
    await ns.scp("prep-host-stage-1.js", server.name, "home");
    await ns.scp("prep-host-stage-2.js", server.name, "home");
    ns.exec("prep-host-stage-1.js", server.name);
}

function retrieveBestHackTarget(ns, servers) {
    
}

