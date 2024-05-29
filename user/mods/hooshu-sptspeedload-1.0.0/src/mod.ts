import { DependencyContainer } from "tsyringe";

import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { IDatabaseTables } from "@spt-aki/models/spt/server/IDatabaseTables";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { LogTextColor } from "@spt-aki/models/spt/logging/LogTextColor";

class Mod implements IPostDBLoadMod {
    private modConfig = require("../config.json");

    public postDBLoad(container: DependencyContainer): void {
        // get database from server
        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const logger = container.resolve<ILogger>("WinstonLogger");

        // Get all the in-memory json found in /assets/database
        const tables: IDatabaseTables = databaseServer.getTables();

        const globals = tables.globals;

        // Change the base loading time of the magazines
        globals.config.BaseLoadTime = this.modConfig.baseLoadTime; // vanilla default: 0.85
        // Change the base unloading time of the magazines
        globals.config.BaseUnloadTime = this.modConfig.baseUnloadTime; // vanilla default: 0.3

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

module.exports = { mod: new Mod() };
