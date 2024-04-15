
export async function main(ns) {
    let files = [
        "/lib/utils.js",
        "grow-target.js",
        "hack-target.js",
        "weaken-target.js",
        "hacking-manager.js",
        "hacknet-manager.js"
    ];

    let host = ns.getHostname();
    let hostMaxRam = ns.getServerMaxRam(host);
    let stage2ram = 2.5;
    let maxThreads = Math.floor(hostMaxRam/stage2ram);

  
    await ns.scp(files, host, "home");

    ns.spawn("prep-host-stage-2.js", {threads: maxThreads, spawnDelay: 1000})
}