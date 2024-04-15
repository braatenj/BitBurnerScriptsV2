
export async function main(ns) {
    let host = ns.getHostname();
    let hostMinSecurity = ns.getServerMinSecurityLevel(host);
    let hostMaxMoney = ns.getServerMaxMoney(host);

    while((ns.getServerSecurityLevel(host) > hostMinSecurity) && (ns.getServerMoneyAvailable(host) < hostMaxMoney)) {
        if(ns.getServerSecurityLevel > hostMinSecurity) {
            await ns.weaken(host);
        } else {
            await ns.grow(host);
        }
    }
}