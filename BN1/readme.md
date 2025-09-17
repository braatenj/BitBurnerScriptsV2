# BitNode 1

## No Source Files

When first starting out the game and you are in bitnode 1 with no source files, there are many things that you are unable to do programmatically either due to RAM constraints, or due to not having access to certain commands.

1. Purchase TOR Router and Programs
2. Join Factions
3. Purchase Augments
4. restart daemon

### Current Problems To Solve

- Manage Factions
- Manage Purchasing Servers
- Manage Purchasing Hacknets
- Manage Purchasing Augmentations
- Manage Stock Market
- BN1 Daemon does not check if hackTarget is already target of hack so its likely it will launch another hack at the target the next cycle if the hack time takes longer than the cycle wait (30s)

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
