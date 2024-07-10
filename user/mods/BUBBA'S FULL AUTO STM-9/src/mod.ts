var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const LogTextColor_1 = require("C:/snapshot/project/obj/models/spt/logging/LogTextColor");
const path_1 = __importDefault(require("path"));
class Mod {
    preAkiLoad(container) {
        const logger = container.resolve("WinstonLogger");
        logger.logWithColor("spray and pray", LogTextColor_1.LogTextColor.GREEN);
    }
    postDBLoad(container) {
        const databaseServer = container.resolve("DatabaseServer");
        const tables = databaseServer.getTables();
        const stm9 = tables.templates.items["60339954d62c9b14ed777c06"];
        //---------------------------------------------------------------------------------------------
        //stm-9 changes
        stm9._props.weapFireType.push("fullauto");
        stm9._props.bFirerate = 800;
    }
}
module.exports = { mod: new Mod() };