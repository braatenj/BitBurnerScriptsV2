export async function main(ns) {
    ns.disableLog(`ALL`);
    ns.tprint(`Initializing Vladburner fully automated hacking suite.`);

    if(!ns.fileExists("vb-update.js")) {
        ns.tprint("Downloading vb-update.");
        await ns.wget("https://raw.githubusercontent.com/braatenj/BitBurnerScriptsV2/main/vb-update.js", "vb-update.js");
    }
    
    if(ns.args.length === 0) {
        ns.tprint("Spawning Update process.");
        ns.spawn('vb-update.js', {threads: 1, spawnDelay: 1000});
    }

    if(ns.args.includes("updated")) {
        ns.tprint("Switching to staging.")
        ns.spawn('vb-staging.js', {threads: 1, spawnDelay: 1000});
    }

}

