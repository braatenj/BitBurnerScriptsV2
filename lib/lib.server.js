export default class Server {
  constructor(ns, hostname) {
    this.ns = ns;
    this.id = hostname;
  }

  get data() {
    return this.ns.getServer(this.id);
  }
  get;
}
