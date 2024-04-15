export async function main(ns) {
    let nodeLimit = 8;
    let cpuLimit = 2;
    let ramLimit = 2;
    let nodeCount = 0;
    let moneyRatio = .25;

    nodeCount = ns.hacknet.numNodes();

    while(nodeCount < nodeLimit) {
        let nodePurchaseCost = ns.hacknet.getPurchaseNodeCost();

        if(nodePurchaseCost <= (ns.getServerMoneyAvailable("home") * moneyRatio)) {
            ns.hacknet.purchaseNode();
            nodeCount = ns.hacknet.numNodes();
        }

        await ns.sleep(TEN_MINUTES);
    }

    
}