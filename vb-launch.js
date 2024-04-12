export async function main(ns) {
    ns.disableLog(`ALL`);
    ns.tprint(`Initializing Vladburner fully automated hacking suite.`);
    
    if(ns.args.length === 0) {
        ns.spawn('vb-update.js', {threads: 1, spawnDelay: 1000});
    }

}

