import { DependencyContainer }  from "tsyringe";
import { IPostDBLoadMod }       from "@spt/models/external/IPostDBLoadMod";
import { DatabaseServer }       from "@spt/servers/DatabaseServer";
import { ImporterUtil }         from "@spt/utils/ImporterUtil";
import { ILogger }              from "@spt/models/spt/utils/ILogger";
import { ICoreDatabase }        from "@spt/atlas/ICoreDatabase";
import { PreSptModLoader }      from "@spt/loaders/PreSptModLoader";
import { IDatabaseTables }      from "@spt/models/spt/server/IDatabaseTables";
import { JsonUtil }             from "@spt/utils/JsonUtil"


class MagTape implements IPostDBLoadMod 
{
    private db:         IDatabaseTables;
    private mydb:       ICoreDatabase;
    private logger:     ILogger;
    private jsonUtil:   JsonUtil;

    public postDBLoad(container: DependencyContainer): void 
    {
        this.logger =               container.resolve<ILogger>("WinstonLogger");
        this.jsonUtil =             container.resolve<JsonUtil>("JsonUtil");

        const databaseServer =      container.resolve<DatabaseServer>("DatabaseServer");
        const databaseImporter =    container.resolve<ImporterUtil>("ImporterUtil");
        const modLoader =           container.resolve<PreSptModLoader>("PreSptModLoader");

        const modFolderName =   "MoxoPixel-MagTape";

        const traders = {
            "668aaff35fd574b6dcc4a686":     "668aaff35fd574b6dcc4a686"
        };

        this.db = databaseServer.getTables();
        this.mydb = databaseImporter.loadRecursive(`${modLoader.getModPath(modFolderName)}database/`);

        for (const newItem in this.mydb.items)
        {
            this.cloneItem(this.mydb.items[newItem].clone, newItem);
            this.addCompatibilitiesAndConflicts(this.mydb.items[newItem].clone, newItem);
        
            const newItemLocales = this.mydb.items[newItem].locales;
            for (const lang in this.db.locales.global) 
            {
                this.db.locales.global[lang][`${newItem} Name`] = newItemLocales.Name;
                this.db.locales.global[lang][`${newItem} ShortName`] = newItemLocales.Shortname;
                this.db.locales.global[lang][`${newItem} Description`] = newItemLocales.Description;
            }
        }
        for (const trader in traders) this.addTraderAssort(traders[trader]);
    
    }

    private cloneItem(itemToClone: string, magTapeID: string): void
    {
        if ( this.mydb.items[magTapeID].enable == true )
        {
            let magTapeItemOut = this.jsonUtil.clone(this.db.templates.items[itemToClone]);

            magTapeItemOut._id = magTapeID;
            magTapeItemOut = this.compareAndReplace(magTapeItemOut, this.mydb.items[magTapeID]["items"]);

            this.db.templates.items[magTapeID] = magTapeItemOut;

            const handbookEntry = {
                "Id": magTapeID,
                "ParentId": this.mydb.items[magTapeID]["handbook"]["ParentId"],
                "Price": this.mydb.items[magTapeID]["handbook"]["Price"]
            };

            this.db.templates.handbook.Items.push(handbookEntry);
        }
    }

    private compareAndReplace(originalItem, attributesToChange)
    {
        for (const key in attributesToChange)
        {
            if ( (["boolean", "string", "number"].includes(typeof attributesToChange[key])) || Array.isArray(attributesToChange[key]) )
            {
                if ( key in originalItem ) originalItem[key] = attributesToChange[key];
                else this.logger.error("Error finding the attribute: \"" + key + "\", default value is used instead.");
            } 
            else originalItem[key] = this.compareAndReplace(originalItem[key], attributesToChange[key]);
        }

        return originalItem;
    }

    private addCompatibilitiesAndConflicts(itemClone: string, magTapeID: string): void
    {
        for (const item in this.db.templates.items)
        {
            if ( item in this.mydb.items ) continue;
            
            const slots = (typeof this.db.templates.items[item]._props.Slots === "undefined")            ? [] : this.db.templates.items[item]._props.Slots;
            const chambers = (typeof this.db.templates.items[item]._props.Chambers === "undefined")      ? [] : this.db.templates.items[item]._props.Chambers;
            const cartridges = (typeof this.db.templates.items[item]._props.Cartridges === "undefined")  ? [] : this.db.templates.items[item]._props.Cartridges;
            const combined = slots.concat(chambers, cartridges)

            for (const entry of combined)
            {
                for (const id of entry._props.filters[0].Filter)
                {
                    if ( id === itemClone ) entry._props.filters[0].Filter.push(magTapeID);
                }
            }

            const conflictingItems = (typeof this.db.templates.items[item]._props.ConflictingItems === "undefined") ? [] : this.db.templates.items[item]._props.ConflictingItems;
            for (const conflictID of conflictingItems) if ( conflictID === itemClone ) conflictingItems.push(magTapeID);
        }
    }

    private addTraderAssort(trader: string): void 
    {
        for (const item in this.mydb.traders[trader].assort.items) 
        {
            this.db.traders[trader].assort.items.push(this.mydb.traders[trader].assort.items[item]);
        }

        for (const item in this.mydb.traders[trader].assort.barter_scheme) 
        {
            this.db.traders[trader].assort.barter_scheme[item] = this.mydb.traders[trader].assort.barter_scheme[item];
        }

        for (const item in this.mydb.traders[trader].assort.loyal_level_items) 
        {
            this.db.traders[trader].assort.loyal_level_items[item] = this.mydb.traders[trader].assort.loyal_level_items[item];
        }
    }
}

module.exports = { mod: new MagTape() }