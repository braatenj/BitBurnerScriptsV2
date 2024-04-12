export async function main(ns) {
    updateFiles(ns);

}

function updateFiles(ns) {
    let host = ns.getHostname();
    let scripts = ns.ls(host, ".js");
    let githubRoot = "https://raw.githubusercontent.com/braatenj/BitBurnerScriptsV2/main/";
    let scripts = [
        "v"
    ]
    
    for(const script of scripts) {
        if(script === "vb-launch.js") {
            continue;
        }


        ns.rm(script);
    }


}