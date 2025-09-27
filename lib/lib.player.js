export default class Player {
  constructor(ns, name) {
    this.ns = ns;
    this.player = name;
  }

  get data() {
    return this.ns.getPlayer();
  }

  get entropy() {
    return this.data.entropy;
  }

  get factions() {
    return this.data.factions;
  }

  get jobs() {
    return this.data.jobs;
  }

  get karma() {
    return this.data.karma;
  }

  get location() {
    return this.data.location;
  }

  get money() {
    return this.data.money;
  }

  get killCount() {
    return this.data.numPeopleKilled;
  }

  get playTime() {
    return this.data.totalPlayTime;
  }

  get city() {
    return this.data.city;
  }

  get exp() {
    return this.data.exp;
  }

  get hp() {
    return this.data.hp;
  }

  get mults() {
    return this.data.mults;
  }

  get skills() {
    return this.data.skills;
  }

  backdoorServer(server) {}
  rootServer(server) {}
}
