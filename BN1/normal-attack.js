import { Server, buildServerList, TEN_MINUTES } from "./lib/utils.js"

export async function main(ns) {
    ns.disableLog(`ALL`);
    let scripts = [
        {"name": "hacking-manager.js", "ram": 2.9, "started": false},
        {"name": "hacknet-manager.js", "ram": 5.7, "started": false},
    ];

    let servers = buildServerList(ns);

    let scriptsToStart = scripts.filter((script) => {return !script.started});

    while(scriptsToStart.length > 0) {
        for(let i = 0; i < scriptsToStart.length; i++) {
            let script = scriptsToStart[i];
            let possibleHosts = servers.filter((server) => {
                return (server.freeRam() >= script.ram) && server.isRooted();
            });
            possibleHosts.sort((a, b) => {
                return a.freeRam() - b.freeRam();
            })

            if(possibleHosts.length > 0) {
                let host = possibleHosts[0];
                if(ns.exec(script.name, host.name) !== -1) {
                    script.started = true;
                }
            }

        }

        scriptsToStart = scripts.filter((script) => {return !script.started});
        await ns.sleep(TEN_MINUTES);
    }
}