export default class Server {
  constructor(ns, hostname) {
    this.ns = ns;
    this.id = hostname;
  }

  get data() {
    return this.ns.getServer(this.id);
  }
  get backdoored() {
    return this.data.backdoorInstalled;
  }
  get ports() {
    return {
      ftp: this.data.ftpPortOpen,
      http: this.data.httpPortOpen,
      smtp: this.data.smtpPortOpen,
      sql: this.data.sqlPortOpen,
      ssh: this.data.sshPortOpen,
      open: this.data.openPortCount,
      required: this.data.numOpenPortsRequired,
    };
  }

  get cores() {
    return this.data.cpuCores;
  }

  get security() {
    return {
      min: this.data.minDifficulty,
      current: this.data.hackDifficuly,
    };
  }

  get admin() {
    return this.data.hasAdminRights;
  }

  get hostname() {
    return this.data.hostname;
  }

  get ram() {
    return {
      max: this.data.maxRam,
      used: this.data.ramUsed,
      free: this.data.maxRam - this.data.ramUsed,
    };
  }

  get money() {
    return {
      max: this.data.moneyMax,
      available: this.data.moneyAvailable,
    };
  }

  get purchased() {
    return this.data.purchasedByPlayer;
  }

  get level() {
    return this.data.requiredHackingSkill;
  }

  get ip() {
    return this.data.ip;
  }

  get connected() {
    return this.data.isConnectedTo;
  }

  get threads() {
    return {
      hack: this.ram.free / 1.7,
      grow: this.ram.free / 1.75,
      weaken: this.ram.free / 1.75,
    };
  }
}
