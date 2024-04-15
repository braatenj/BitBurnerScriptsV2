
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
    let hostMinSecurity = ns.getServerMinSecurityLevel(host);
    let hostMaxMoney = ns.getServerMaxMoney(host);
    let hostFreeRam = (ns.getServerMaxRam(host) - ns.getServerUsedRam(host))
    let growRam = 1.75;
    let weakenRam = 1.75;
    let maxThreads = Math.floor(hostFreeRam/growRam);

    await ns.scp(files, host, "home");

    while((ns.getServerSecurityLevel(host) > hostMinSecurity) && (getServerMoneyAvailable(host) < hostMaxMoney)) {
        if(ns.getServerSecurityLevel > hostMinSecurity) {
            ns.run("weaken-target.js", maxThreads, host, 0);
        } else {
            ns.run("grow-target.js", maxThreads, host, 0);
        }
    }
}