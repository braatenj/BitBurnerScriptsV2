export async function main(ns) {
    updateFiles(ns);

}

async function updateFiles(ns) {
    ns.tprint("Getting latest Vladburner scripts...");
    let host = ns.getHostname();
    let files = ns.ls(host, ".js");
    let githubRoot = "https://raw.githubusercontent.com/braatenj/BitBurnerScriptsV2/main/";
    await ns.wget(githubRoot + "files.txt", "file_updates.txt");
    let scripts = JSON.parse(ns.read("file_updates.txt"));

    ns.rm("file_updates.txt");
    
    for(const file of files) {
        if(file === "vb-update.js") {
            continue;
        }


        ns.rm(file);
    }

    for(const script of scripts) {
        await ns.wget(githubRoot + script, script);
    }

    ns.tprint("Vladburner scripts updated, relaunching Vladburner");
    ns.spawn("vb-launch.js", {threads: 1, spawnDelay: 1500}, "updated");




}