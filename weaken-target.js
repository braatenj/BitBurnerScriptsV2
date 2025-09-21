export async function main(ns) {
    let job = JSON.parse(ns.args[0]);
    //calculate delay
    let delay = job.endTime - job.runTime - performance.now();
    if (delay < 0) {
        ns.tprintf('WARN: Action was %dms too late', delay);
        delay = 0;
    }


    await ns.weaken(job.target, { additionalMsec: delay });

}