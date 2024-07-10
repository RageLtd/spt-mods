import { DependencyContainer } from "tsyringe";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { PreSptModLoader } from "@spt/loaders/PreSptModLoader";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { ImageRouter } from "@spt/routers/ImageRouter";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { ITraderAssort, ITraderBase } from "@spt/models/eft/common/tables/ITrader";
import { ITraderConfig, UpdateTime } from "@spt/models/spt/config/ITraderConfig";
import { JsonUtil } from "@spt/utils/JsonUtil";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { Traders } from "@spt/models/enums/Traders";
import * as baseJson from "../db/base.json";
import * as assortJson from "../db/assort.json";
import * as path from "path";

const fs = require('fs');
const modPath = path.normalize(path.join(__dirname, '..'));

class painter implements IPreSptLoadMod, IPostDBLoadMod {
    mod: string
    logger: ILogger
    private configServer: ConfigServer
    private ragfairConfig: IRagfairConfig

    constructor() {
        this.mod = "aMoxoPixel-Painter"
    }

    public preSptLoad(container: DependencyContainer): void {
        this.logger = container.resolve<ILogger>("WinstonLogger")

        const PreSptModLoader: PreSptModLoader = container.resolve<PreSptModLoader>("PreSptModLoader")
        const imageRouter: ImageRouter = container.resolve<ImageRouter>("ImageRouter")
        const configServer = container.resolve<ConfigServer>("ConfigServer")
        const traderConfig: ITraderConfig = configServer.getConfig<ITraderConfig>(ConfigTypes.TRADER)
        
        this.registerProfileImage(PreSptModLoader, imageRouter)
        
        this.setupTraderUpdateTime(traderConfig)
        
        Traders["668aaff35fd574b6dcc4a686"] = "668aaff35fd574b6dcc4a686"
    }
    
    public postDBLoad(container: DependencyContainer): void {
        this.configServer = container.resolve("ConfigServer")
        this.ragfairConfig = this.configServer.getConfig(ConfigTypes.RAGFAIR)

        const databaseServer: DatabaseServer = container.resolve<DatabaseServer>("DatabaseServer")
        const configServer: ConfigServer = container.resolve<ConfigServer>("ConfigServer")
        const imageRouter: ImageRouter = container.resolve<ImageRouter>("ImageRouter")
        const traderConfig: ITraderConfig = configServer.getConfig(ConfigTypes.TRADER)
        const jsonUtil: JsonUtil = container.resolve<JsonUtil>("JsonUtil")
        const tables = databaseServer.getTables()

        this.addTraderToDb(baseJson, tables, jsonUtil)
        this.addTraderToLocales(tables, baseJson.name, "Ivan Samoylov", baseJson.nickname, baseJson.location, "Ivan Samoylov is a master craftsman renowned for his exceptional skill in creating exquisite weapon cosmetics. With an innate talent for blending artistry and functionality, he transforms ordinary weapons into mesmerizing works of art.")
        this.ragfairConfig.traders[baseJson._id] = true

        this.importQuests(tables)
        this.importQuestLocales(tables)
        this.routeQuestImages(imageRouter)
    }

    private registerProfileImage(preSptModLoader: PreSptModLoader, imageRouter: ImageRouter): void {
        const imageFilepath = `./${preSptModLoader.getModPath(this.mod)}res`

        imageRouter.addRoute(baseJson.avatar.replace(".jpg", ""), `${imageFilepath}/painter.jpg`)
    }

    private setupTraderUpdateTime(traderConfig: ITraderConfig): void {
        const traderRefreshRecord: UpdateTime = { traderId: baseJson._id, seconds: { min: 2000, max: 6600 } }
        
        traderConfig.updateTime.push(traderRefreshRecord)
    }
    
    private addTraderToDb(traderDetailsToAdd: any, tables: IDatabaseTables, jsonUtil: JsonUtil): void {
        tables.traders[traderDetailsToAdd._id] = {
            assort: jsonUtil.deserialize(jsonUtil.serialize(assortJson)) as ITraderAssort,
            base: jsonUtil.deserialize(jsonUtil.serialize(traderDetailsToAdd)) as ITraderBase,
            questassort: {
                started: {},
                success: {
                    "PA_CONTAINER": "668aad3c3ff8f5b258e3a65b",
                    "PA_556_M855A1": "668c18eb12542b3c3ff6e20f",
                    "PA_762_M61": "668c18eb12542b3c3ff6e20f"
                },
                fail: {}
            }
        }
    }
    
    private addTraderToLocales(tables: IDatabaseTables, fullName: string, firstName: string, nickName: string, location: string, description: string) {
        const locales = Object.values(tables.locales.global) as Record<string, string>[]
        for (const locale of locales) {
            locale[`${baseJson._id} FullName`] = fullName
            locale[`${baseJson._id} FirstName`] = firstName
            locale[`${baseJson._id} Nickname`] = nickName
            locale[`${baseJson._id} Location`] = location
            locale[`${baseJson._id} Description`] = description
        }
    }

    public loadFiles(dirPath, extName, cb) {
        if (!fs.existsSync(dirPath)) return
        const dir = fs.readdirSync(dirPath, { withFileTypes: true })
        dir.forEach(item => {
            const itemPath = path.normalize(`${dirPath}/${item.name}`)
            if (item.isDirectory()) this.loadFiles(itemPath, extName, cb)
            else if (extName.includes(path.extname(item.name))) cb(itemPath)
        });
    }

    public importQuests(tables) {
        let questCount = 0

        this.loadFiles(`${modPath}/db/quests/`, [".json"], function(filePath) {
            const item = require(filePath)
            if (Object.keys(item).length < 1) return 
            for (const quest in item) {
                tables.templates.quests[quest] = item[quest]
                questCount++
            }
        })
    }

    public importQuestLocales(tables) {
        const serverLocales = ['ch','cz','en','es','es-mx','fr','ge','hu','it','jp','pl','po','ru','sk','tu']
        const addedLocales = {}

        for (const locale of serverLocales) {
            this.loadFiles(`${modPath}/db/locales/${locale}`, [".json"], function(filePath) {
                const localeFile = require(filePath)
                if (Object.keys(localeFile).length < 1) return
                for (const currentItem in localeFile) {
                    tables.locales.global[locale][currentItem] = localeFile[currentItem]
                    if (!Object.keys(addedLocales).includes(locale)) addedLocales[locale] = {}
                    addedLocales[locale][currentItem] = localeFile[currentItem]
                }
            })
        }

        for (const locale of serverLocales) {
            if (locale == "en") continue
            for (const englishItem in addedLocales["en"]) {
                if (locale in addedLocales) { 
                    if (englishItem in addedLocales[locale]) continue
                }
                if (tables.locales.global[locale] != undefined) tables.locales.global[locale][englishItem] = addedLocales["en"][englishItem]
            }
        }
    }

    public routeQuestImages(imageRouter) {
        let imageCount = 0

        this.loadFiles(`${modPath}/res/quests/`, [".png", ".jpg"], function(filePath) {
            imageRouter.addRoute(`/files/quest/icon/${path.basename(filePath, path.extname(filePath))}`, filePath);
            imageCount++
        })
    }
}

module.exports = { mod: new painter() }