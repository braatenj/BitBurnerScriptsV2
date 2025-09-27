import { Server } from "./lib.server";

export default class Game {
  constructor(ns) {
    //start with empty array, will contain server objects of all servers scanned on the network.
    this.ns = ns;
    this.network = [];

    //flags to control launching of different managers
    this.batchDisabled = true;
    this.hacknetDisabled = true;
    this.stockDisabled = true;
    this.crimeDisabled = true;
    this.gangDisabled = true;
    this.pServersDisabled = true;
    this.updateNetwork();
  }

  //rescans the network to pick up additional servers
  updateNetwork() {
    this.network = [];
    let visitedServers = [];
    let currentServers = ["home"];

    while (currentServers.length > 0) {
      let server = currentServers.pop();
      if (!visitedServers.includes(server)) {
        visitedServers.push(server);
        if (copyFiles) copyWorkerScripts(ns, server);

        currentServers.push(...ns.scan(server));
      }
    }

    for (const server of visitedServers) {
      this.network.push(new Server(this.ns, server));
    }
  }
}
