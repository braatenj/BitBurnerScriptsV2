export async function main(ns) {
    let delay = 0;
    let target;

    if(ns.args.length == 2) {
        target = ns.args[0];
        delay = ns.args[1];
    }


    await ns.grow(target, {additionalMSec: delay});
}