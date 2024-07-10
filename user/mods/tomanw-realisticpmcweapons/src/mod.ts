import { DependencyContainer } from "tsyringe";

import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ItemHelper } from "@spt/helpers/ItemHelper";
import { BaseClasses } from "@spt/models/enums/BaseClasses";

class M4A1_PMC implements IPostDBLoadMod
{

    private mod_config = require("../config/config.json");
    public postDBLoad(container: DependencyContainer): void
    {
        // get database from server
        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const tables: IDatabaseTables = databaseServer.getTables();


        // usec gear
        tables.bots.types["usec"].inventory.equipment.FirstPrimaryWeapon = this.mod_config.usec_primary;
        tables.bots.types["usec"].inventory.equipment.Holster = this.mod_config.usec_pistol;
        
        // bear gear
        tables.bots.types["bear"].inventory.equipment.FirstPrimaryWeapon = this.mod_config.bear_primary;
        tables.bots.types["bear"].inventory.equipment.Holster = this.mod_config.bear_pistol;

    }
}

export const mod = new M4A1_PMC();
