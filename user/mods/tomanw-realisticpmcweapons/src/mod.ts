import { DependencyContainer } from "tsyringe";

import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ItemHelper } from "@spt/helpers/ItemHelper";
import { BaseClasses } from "@spt/models/enums/BaseClasses";

class M4A1_PMC implements IPostDBLoadMod
{
    public postDBLoad(container: DependencyContainer): void
    {
        // get database from server
        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const tables: IDatabaseTables = databaseServer.getTables();

        tables.bots.types["bear"].inventory.equipment.FirstPrimaryWeapon = {"5ac66d2e5acfc43b321d4b53": 10, // AK-103
            "55801eed4bdc2d89578b4588": 3, // SV-98
            "59d6088586f774275f37482f": 6, // AKM
            "5ac4cd105acfc40016339859": 4, // AK74M
            "6499849fc93611967b034949": 4, // AK12
            "57c44b372459772d2b39b8ce": 5, // AS Val
            "5beed0f50db834001c062b12": 1, // RPK
            "65268d8ecb944ff1e90ea385": 1, // RPD
            /* add more if you want */

        };
        tables.bots.types["usec"].inventory.equipment.FirstPrimaryWeapon = {"5447a9cd4bdc2dbd208b4567": 5, // M4A1
            "5bb2475ed4351e00853264e3": 4, // HK-416
            "5df8ce05b11454561e39243b": 5, // SR-25
            "5d43021ca4b9362eab4b5e25": 4, // TX-15
            "6184055050224f204c1da540": 2, // Scar-L
            "5fbcc1d9016cce60e8341ab3": 1, // MCX .300
            "65290f395ae2ae97b80fdf2d": 1, // MCX Spear
            "6259b864ebedf17603599e88": 3, // m3 shotgun
            "5bd70322209c4d00d7167b8f": 4, // MP7A2
            "5ba26383d4351e00334c93d9": 4, // MP7A1
            "627e14b21713922ded6f2c15": 1 // AXMC
            /* add more if you want */
        };
    }
}

export const mod = new M4A1_PMC();
