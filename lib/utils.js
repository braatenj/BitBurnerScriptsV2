export function getPlayerInfo(ns) {
    return ns.getPlayer();
}

export function getPlayerMoney(ns) {
    return ns.getServerMoneyAvailable("home");
}

export function getCurrentBitnode(ns) {
    let resetInfo = ns.getResetInfo();
    return resetInfo.currentNode;
}

export function isFreshStart(ns) {
    let resetInfo = ns.getResetInfo();
    if(resetInfo.lastNodeReset === -1) {
        return true;
    } else {
        return false;
    }
}


export function wipeServer(ns, server) {
    let files = ns.ls(server, ".js");
    files.forEach((file) => {
        ns.rm(file, server);
    })

    let count = ns.ls(server, ".js").length;

    return (count == 0 ? true : false);
}





