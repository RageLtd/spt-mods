import { DependencyContainer } from "tsyringe";

import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { DatabaseService } from "@spt/services/DatabaseService";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ItemHelper } from "@spt/helpers/ItemHelper";
import { BaseClasses } from "@spt/models/enums/BaseClasses";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";

class Mod implements IPostDBLoadMod
{
    private modConfig = require("../config/config.json");
    public postDBLoad(container: DependencyContainer): void
    {
        // Get logger going
        const logger = container.resolve<ILogger>("WinstonLogger");
        logger.logWithColor("[THP] TheHalfPotato's Stacks Multiplier going!", LogTextColor.GREEN);
        if (this.modConfig.debug) 
        {
            logger.logWithColor("[THP] Debug is on - Logging changes to console", LogTextColor.YELLOW);
        }

        // Get database service going
        const databaseService = container.resolve<DatabaseService>("DatabaseService");

        // Get some tables ???
        const tables: IDatabaseTables = databaseService.getTables();

        // ITEM HELPER WHOOO
        const itemHelper: ItemHelper = container.resolve<ItemHelper>("ItemHelper");
        
        // So then we get the items :)
        const items = Object.values(tables.templates.items);


        // And grab the ammo
        const allAmmo = items.filter(x => itemHelper.isOfBaseclass(x._id, BaseClasses.AMMO))
        const moneyStacks = items.filter(y => itemHelper.isOfBaseclass(y._id, BaseClasses.MONEY))

        // Now this is where the magic happens <3
        for (const ammo of allAmmo)
        {
            if (ammo._props.StackMaxSize && (this.modConfig.onlyAmmo ? ammo._props.Name.startsWith("patron") : true))
            {
                ammo._props.StackMaxSize = ammo._props.StackMaxSize * this.modConfig.ammoStackMult;
                if (this.modConfig.debug)
                {
                    logger.logWithColor("[THP] Set stack size of "+ammo._name+" to: "+ammo._props.StackMaxSize, LogTextColor.GREEN);
                }
            }
        }

        for (const money of moneyStacks)
        {
            money._props.StackMaxSize = money._props.StackMaxSize * this.modConfig.moneyStackMult;
            if (this.modConfig.debug)
            {
                logger.logWithColor("[THP] Set stack size of "+money._name+" to "+money._props.StackMaxSize, LogTextColor.GREEN);
            }
        }


    }
}

export const mod = new Mod();
