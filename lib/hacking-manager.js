import { Server, buildServerList, ONE_MINUTE, FIVE_MINUTES, TEN_MINUTES } from "./utils"


export async function main(ns) {
    let servers = buildServerList(ns);

    
    while(true) {
        let targets = getCrackingTargets(servers);

        for(let i = 0; i < targets.length; i++) {
            let target = targets[i];
            target.getRootAccess();
        }



        await ns.sleep(ONE_MINUTE);
    }

}

function getCrackingTargets(servers) {
    let results = servers.filter((server) => {
        return (server.canHack() && server.canCrack() && !server.isRooted())
    })
}

