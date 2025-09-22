# BitNode 1

## No Source Files

When first starting out the game and you are in bitnode 1 with no source files, there are many things that you are unable to do programmatically either due to RAM constraints, or due to not having access to certain commands.

1. Purchase TOR Router and Programs
2. Join Factions
3. Purchase Augments
4. restart daemon

### Current Problems To Solve

- Calculate best target/most amount to steal from target (currently it just hard coded to n00dles and 10% of max which is problematic early and late game)
- Manage Factions
- Manage Purchasing Servers
  - Manage Upgrading Servers
- Manage Purchasing Augmentations
- Manage Stock Market
- Manage Crimes
- batcherv1 sending bad timing data during prep of target, ultimate it doesn't break anything but it shouldn't be doing that

#### Factions

Sector-12

- CashRoot Starter Kit (12.5K Rep, $125M) (unique)
- Nueralstimulator (50K Rep, $3B)
- NeuroFlux Governor (500 Rep, $750k+)

CyberSec (CSEC)
NiteSec (avmnite-02h)

- Nueral-Retention Enhancement (20k Rep, $250M) (unique)
- CRTX42-AA Gene Modification (45k Rep, $225M) (unique)

###### Notes

j0.msg -> fl1ght.exe
j1.msg -> CSEC
j2.msg -> NiteSec

Things that need singularity (SF4)
-installBackdoor()
-purchaseTor()
-purchaseProgram()
-destroyWorldDaemon
checkFactionInvitations
joinFaction()
workForFaction()
universityCourse() -> Train Hacking Early On

Timings
Hack = x
Grow = 3.2x
Weaken = 4x
