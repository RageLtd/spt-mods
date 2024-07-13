import { DependencyContainer } from "tsyringe";

import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { DatabaseService } from "@spt/services/DatabaseService";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";

class Mod implements IPostDBLoadMod
{
    private configuration = require("../config.json");

    public postDBLoad(container: DependencyContainer): void
    {
        // get database from server
        const databaseService = container.resolve<DatabaseService>("DatabaseService");
        const logger = container.resolve<ILogger>("WinstonLogger");

        // Get all the in-memory json found in /assets/database
        const tables: IDatabaseTables = databaseService.getTables();

        const globals = tables.globals;

        // Change the base loading time of the magazines
        globals.config.BaseLoadTime = this.configuration.baseLoadTime; // vanilla default: 0.85
        // Change the base unloading time of the magazines
        globals.config.BaseUnloadTime = this.configuration.baseUnloadTime; // vanilla default: 0.3

        // Log the changes
        logger.logWithColor(
            "Changed base loading time of magazines: " + globals.config.BaseLoadTime,
            LogTextColor.GREEN
        );
        logger.logWithColor(
            "Changed base unloading time of magazines: " + globals.config.BaseUnloadTime,
            LogTextColor.GREEN
        );
    }
}

export const mod = new Mod();
