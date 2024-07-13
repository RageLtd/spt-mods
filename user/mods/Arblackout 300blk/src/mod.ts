import { DependencyContainer }      from "tsyringe";
import { IPostDBLoadMod }           from "@spt-aki/models/external/IPostDBLoadMod";
import { DatabaseServer }           from "@spt-aki/servers/DatabaseServer";
import { ImporterUtil }             from "@spt-aki/utils/ImporterUtil";
import { ILogger }                  from "@spt-aki/models/spt/utils/ILogger";
import { PreSptModLoader }          from "@spt-aki/loaders/PreSptModLoader";
import { IDatabaseTables }          from "@spt-aki/models/spt/server/IDatabaseTables";
import { JsonUtil }                 from "@spt-aki/utils/JsonUtil"
import { ITemplateItem, Slot }      from "@spt-aki/models/eft/common/tables/ITemplateItem";
import { ICustomizationItem }       from "@spt-aki/models/eft/common/tables/ICustomizationItem";
import { IGWDatabase }              from "@spt-aki/GW/IGWDatabase";
import { IGWItem, IGWLocale }       from "@spt-aki/GW/IGWItem";
import { IGWCustomizationItem }     from "@spt-aki/GW/IGWCustomizationItem";



//Config file
import modConfig = require("../config.json");


//Item template file
import itemTemplate =       require("../templates/item_template.json");
import articleTemplate =    require("../templates/article_template.json");


class GWitems implements IPostDBLoadMod
{
    private db:         IDatabaseTables;
    private mydb:       IGWDatabase;    
    private logger:     ILogger;
    private jsonUtil:   JsonUtil;

    public postDBLoad(container: DependencyContainer): void
    {
        this.logger =               container.resolve<ILogger>("WinstonLogger");
        this.jsonUtil =             container.resolve<JsonUtil>("JsonUtil");

        const databaseServer =      container.resolve<DatabaseServer>("DatabaseServer");
        const databaseImporter =    container.resolve<ImporterUtil>("ImporterUtil");
        const modLoader =           container.resolve<PreSptModLoader>("PreSptModLoader");

        //Mod Info
        const modFolderName =   "Arblackout 300blk";
        const modFullName =     "Arblackout 300blk";

        //Trader IDs
        const traders = {
            "prapor":       "54cb50c76803fa8b248b4571",
            "therapist":    "54cb57776803fa99248b456e",
            "skier":        "58330581ace78e27b8b10cee",
            "peacekeeper":  "5935c25fb3acc3127c3d8cd9",
            "mechanic":     "5a7c2eca46aef81a7ca2145d",
            "ragman":       "5ac3b934156ae10c4430e83c",
            "jaeger":       "5c0647fdd443bc2504c2d371"
        };

        //Currency IDs
        const currencies = {
            "roubles":  "5449016a4bdc2d6f028b456f",
            "dollars":  "5696686a4bdc2da3298b456a",
            "euros":    "569668774bdc2da2298b4568"
        }

        //Get the server database and our custom database
        this.db = databaseServer.getTables();
        this.mydb = databaseImporter.loadRecursive(`${modLoader.getModPath(modFolderName)}database/`);
        this.logger.info("Loading: " + modFullName);


        //Items
        for (const [GWID, GWItem] of Object.entries(this.mydb.GW_items))
        {
            //Items + Handbook
            if ( GWItem.enable )
            {
                if ( "clone" in GWItem )
                {
                    this.cloneItem(GWItem.clone, GWID);
                    this.copyToFilters(GWItem.clone, GWID, GWItem.enableCloneCompats, GWItem.enableCloneConflicts);
                }
                else this.createItem(GWID);

                //Locales (Languages)
                this.addLocales(GWID, GWItem);

                //Trades
                //this.addTrades(GWID, GWItem, traders, currencies);
            }
        }
        this.logger.debug(modFolderName + " items and handbook finished");


        //Item Filters
        for (const GWID in this.mydb.GW_items) if ( this.mydb.GW_items[GWID].enable ) this.addToFilters(GWID);
        this.logger.debug(modFolderName + " item filters finished");

        //Clothing
        for (const [GWID, GWArticle] of Object.entries(this.mydb.GW_clothes))
        {
            //Articles + Handbook
            if ( "clone" in GWArticle )
            {
                this.cloneClothing(GWArticle.clone, GWID);
            }
            else
            {
                //Doesn't do anything yet...
                this.createClothing(GWID);
            }

            //Locales (Languages)
            this.addLocales(GWID, undefined, GWArticle);

            //Trades
            //this.addTrades(GWID, GWItem, traders, currencies);
        }
        this.logger.debug(modFolderName + " clothing finished");

        //Presets
        for (const preset in this.mydb.globals.ItemPresets) this.db.globals.ItemPresets[preset] = this.mydb.globals.ItemPresets[preset];
        this.logger.debug(modFolderName + " presets finished");

        //Traders
        for (const trader in traders)
        {
            this.addTraderAssort(traders[trader]);
            this.addTraderSuits(traders[trader]);
        }
        this.logger.debug(modFolderName + " traders finished");

        //Stimulator Buffs
        //for (const buff in this.mydb.globals.config.Health.Effects.Stimulator.Buffs) this.db.globals.config.Health.Effects.Stimulator.Buffs[buff] = this.mydb.globals.config.Health.Effects.Stimulator.Buffs[buff];
        //this.logger.debug(modFolderName + " stimulator buffs finished");

        //Mastery
        const dbMastering = this.db.globals.config.Mastering
        for (const weapon in this.mydb.globals.config.Mastering) dbMastering.push(this.mydb.globals.config.Mastering[weapon]);
        for (const weapon in dbMastering) 
        {
            if (dbMastering[weapon].Name == "M4") dbMastering[weapon].Templates.push("weapon_arblackout_300blk");
        }
        this.logger.debug(modFolderName + " mastery finished");
    }

    private cloneItem(itemToClone: string, GWID: string): void
    {
        //If the item is enabled in the json
        if ( this.mydb.GW_items[GWID].enable == true )
        {
            //Get a clone of the original item from the database
            let GWItemOut = this.jsonUtil.clone(this.db.templates.items[itemToClone]);

            //Change the necessary item attributes using the info in our database file GW_items.json
            GWItemOut._id = GWID;
            GWItemOut = this.compareAndReplace(GWItemOut, this.mydb.GW_items[GWID]["item"]);

            //Add the new item to the database
            this.db.templates.items[GWID] = GWItemOut;
            this.logger.debug("Item " + GWID + " created as a clone of " + itemToClone + " and added to database.");

            //Create the handbook entry for the items
            const handbookEntry = {
                "Id": GWID,
                "ParentId": this.mydb.GW_items[GWID]["handbook"]["ParentId"],
                "Price": this.mydb.GW_items[GWID]["handbook"]["Price"]
            };

            //Add the handbook entry to the database
            this.db.templates.handbook.Items.push(handbookEntry);
            this.logger.debug("Item " + GWID + " added to handbook with price " + handbookEntry.Price);
        }
    }

    private createItem(itemToCreate: string): void
    {
        //Create an item from scratch instead of cloning it
        //Requires properly formatted entry in GW_items.json with NO "clone" attribute

        //Get the new item object from the json
        const newItem = this.mydb.GW_items[itemToCreate];

        //If the item is enabled in the json
        if ( newItem.enable )
        {
            //Check the structure of the new item in GW_items
            const [pass, checkedItem] = this.checkItem(newItem);
            if ( !pass ) return;

            //Add the new item to the database
            this.db.templates.items[itemToCreate] = checkedItem;
            this.logger.debug("Item " + itemToCreate + " created and added to database.");

            //Create the handbook entry for the items
            const handbookEntry = {
                "Id": itemToCreate,
                "ParentId": newItem["handbook"]["ParentId"],
                "Price": newItem["handbook"]["Price"]
            };

            //Add the handbook entry to the database
            this.db.templates.handbook.Items.push(handbookEntry);
            this.logger.debug("Item " + itemToCreate + " added to handbook with price " + handbookEntry.Price);
        }
    }

    private checkItem(itemToCheck: IGWItem): [boolean, ITemplateItem]
    {
        //A very basic top-level check of an item to make sure it has the proper attributes
        //Also convert to ITemplateItem to avoid errors

        let pass = true;

        //First make sure it has the top-level 5 entries needed for an item
        for (const level1 in itemTemplate )
        {
            if ( !(level1 in itemToCheck.item) )
            {
                this.logger.error("ERROR - Missing attribute: \"" + level1 + "\" in your item entry!");
                pass = false;
            }
        }

        //Then make sure the attributes in _props exist in the item template, warn user if not.
        for (const prop in itemToCheck.item._props)
        {
            if ( !(prop in itemTemplate._props) ) this.logger.warning("WARNING - Attribute: \"" + prop + "\" not found in item template!");
        }

        const itemOUT: ITemplateItem = {
            "_id":      itemToCheck.item._id,
            "_name":    itemToCheck.item._name,
            "_parent":  itemToCheck.item._parent,
            "_props":   itemToCheck.item._props,
            "_type":    itemToCheck.item._type,
            "_proto":   itemToCheck.item._proto
        };

        return [pass, itemOUT];
    }

    private compareAndReplace(originalItem, attributesToChange)
    {
        //Recursive function to find attributes in the original item/clothing object and change them.
        //This is done so each attribute does not have to be manually changed and can instead be read from properly formatted json
        //Requires the attributes to be in the same nested object format as the item entry in order to work (see GW_items.json and items.json in SPT install)

        for (const key in attributesToChange)
        {
            //If you've reached the end of a nested series, try to change the value in original to new
            if ( (["boolean", "string", "number"].includes(typeof attributesToChange[key])) || Array.isArray(attributesToChange[key]) )
            {
                if ( key in originalItem ) originalItem[key] = attributesToChange[key];
                //TO DO: Add check with item template here if someone wants to add new properties to a cloned item.
                else 
                {
                    this.logger.warning("(Item: " + originalItem._id + ") WARNING: Could not find the attribute: \"" + key + "\" in the original item, make sure this is intended!");
                    originalItem[key] = attributesToChange[key];
                }
            }

            //Otherwise keep traveling down the nest
            else originalItem[key] = this.compareAndReplace(originalItem[key], attributesToChange[key]);
        }

        return originalItem;
    }

    private getFilters(item: string): [Array<Slot>, Array<string>]
    {
        //Get the slots, chambers, cartridges, and conflicting items objects and return them.

        const slots = (typeof this.db.templates.items[item]._props.Slots === "undefined")            ? [] : this.db.templates.items[item]._props.Slots;
        const chambers = (typeof this.db.templates.items[item]._props.Chambers === "undefined")      ? [] : this.db.templates.items[item]._props.Chambers;
        const cartridges = (typeof this.db.templates.items[item]._props.Cartridges === "undefined")  ? [] : this.db.templates.items[item]._props.Cartridges;
        const filters = slots.concat(chambers, cartridges);

        const conflictingItems =  (typeof this.db.templates.items[item]._props.ConflictingItems === "undefined") ? [] : this.db.templates.items[item]._props.ConflictingItems;

        return [filters, conflictingItems];
    }


    private copyToFilters(itemClone: string, GWID: string, enableCompats = true, enableConflicts = true): void
    {
        //Find the original item in all compatible and conflict filters and add the clone to those filters as well
        //Will skip one or both depending on the enable parameters

        for (const item in this.db.templates.items)
        {
            if ( item in this.mydb.GW_items ) continue;
            
            const [filters, conflictingItems] = this.getFilters(item);

            if ( enableCompats )
            {
                for (const filter of filters)
                {
                    for (const id of filter._props.filters[0].Filter)
                    {
                        if ( id === itemClone ) filter._props.filters[0].Filter.push(GWID);
                    }
                }
            }

            if ( enableConflicts ) for (const conflictID of conflictingItems) if ( conflictID === itemClone ) conflictingItems.push(GWID);
        }
    }

    private addToFilters(GWID: string): void
    {
        //Add a new item to compatibility & conflict filters of pre-existing items
        //Add additional compatible and conflicting items to new item filters (manually adding more than the ones that were cloned)

        const GWNewItem = this.mydb.GW_items[GWID];

        //If the item is enabled in the json
        if (GWNewItem.enable)
        {
            this.logger.debug("addToFilters: " + GWID);

            //Manually add items into an THISMOD item's filters
            if ( "addToThisItemsFilters" in GWNewItem )
            {
                const   GWItemFilters =      this.getFilters(GWID)[0];
                let     GWConflictingItems = this.getFilters(GWID)[1];
    
                for (const modSlotName in GWNewItem.addToThisItemsFilters)
                {
                    if ( modSlotName === "conflicts" ) GWConflictingItems = GWConflictingItems.concat(GWNewItem.addToThisItemsFilters.conflicts)
                    else
                    {
                        for (const filter in GWItemFilters)
                        {
                            if ( modSlotName === GWItemFilters[filter]._name )
                            {
                                const slotFilter = GWItemFilters[filter]._props.filters[0].Filter;
                                const newFilter = slotFilter.concat(GWNewItem.addToThisItemsFilters[modSlotName])

                                GWItemFilters[filter]._props.filters[0].Filter = newFilter;
                            }
                        }
                    }
                }
            }
    
            //Manually add THISMOD items to pre-existing item filters.
            if ( "addToExistingItemFilters" in GWNewItem )
            {
                for (const modSlotName in GWNewItem.addToExistingItemFilters)
                {
                    if ( modSlotName === "conflicts" )
                    {
                        for (const conflictingItem of GWNewItem.addToExistingItemFilters[modSlotName])
                        {
                            const conflictingItems = this.getFilters(conflictingItem)[1];
                            conflictingItems.push(GWID);
                        }
                    }
                    else
                    {
                        for (const compatibleItem of GWNewItem.addToExistingItemFilters[modSlotName])
                        {
                            const filters = this.getFilters(compatibleItem)[0];
        
                            for (const filter of filters)
                            {
                                if ( modSlotName === filter._name ) filter._props.filters[0].Filter.push(GWID);
                            }
                        }
                    }
                }
            }
        }
    }

    private cloneClothing(articleToClone: string, GWID: string): void
    {
        if ( this.mydb.GW_clothes[GWID].enable || !("enable" in this.mydb.GW_clothes[GWID]) )
        {
            //Get a clone of the original item from the database
            let GWClothingOut = this.jsonUtil.clone(this.db.templates.customization[articleToClone]);

            //Change the necessary clothing item attributes using the info in our database file GW_clothes.json
            GWClothingOut._id = GWID;
            GWClothingOut._name = GWID;
            GWClothingOut = this.compareAndReplace(GWClothingOut, this.mydb.GW_clothes[GWID]["customization"]);

            //Add the new item to the database
            this.db.templates.customization[GWID] = GWClothingOut;
            this.logger.debug("Clothing item " + GWID + " created as a clone of " + articleToClone + " and added to database.");
        }
    }

    private createClothing(articleToCreate: string): void
    {
        //Create clothing from scratch instead of cloning it
        //Requires properly formatted entry in GW_clothes.json with NO "clone" attribute

        //Get the new article object from the json
        const newArticle = this.mydb.GW_clothes[articleToCreate];

        //If the article is enabled in the json
        if ( newArticle.enable )
        {
            //Check the structure of the new article in GW_clothes
            const [pass, checkedArticle] = this.checkArticle(newArticle);
            if ( !pass ) return;

            //Add the new item to the database
            this.db.templates.customization[articleToCreate] = checkedArticle;
            this.logger.debug("Article " + articleToCreate + " created and added to database.");
        }

    }

    private checkArticle(articleToCheck: IGWCustomizationItem): [boolean, ICustomizationItem]
    {
        //A very basic top-level check of an article to make sure it has the proper attributes
        //Also convert to ITemplateItem to avoid errors

        let pass = true;

        //First make sure it has the top-level 5 entries needed for an item
        for (const level1 in articleTemplate )
        {
            if ( !(level1 in articleToCheck.customization) )
            {
                this.logger.error("ERROR - Missing attribute: \"" + level1 + "\" in your article entry!");
                pass = false;
            }
        }

        //Then make sure the attributes in _props exist in the article template, warn user if not.
        for (const prop in articleToCheck.customization._props)
        {
            if ( !(prop in articleTemplate._props) ) this.logger.warning("WARNING - Attribute: \"" + prop + "\" not found in article template!");
        }

        const articleOUT: ICustomizationItem = {
            "_id":      articleToCheck.customization._id,
            "_name":    articleToCheck.customization._name,
            "_parent":  articleToCheck.customization._parent,
            "_props":   articleToCheck.customization._props,
            "_type":    articleToCheck.customization._type,
            "_proto":   articleToCheck.customization._proto
        };

        return [pass, articleOUT];
    }

    private addTraderAssort(trader: string): void 
    {
        //Items
        for (const item in this.mydb.traders[trader].assort.items) 
        {
            //this.logger.debug(item + " added to " + trader);
            this.db.traders[trader].assort.items.push(this.mydb.traders[trader].assort.items[item]);
        }

        //Barter Scheme
        for (const item in this.mydb.traders[trader].assort.barter_scheme) 
        {
            //this.logger.debug(item + " added to " + trader);
            this.db.traders[trader].assort.barter_scheme[item] = this.mydb.traders[trader].assort.barter_scheme[item];
        }

        //Loyalty Levels
        for (const item in this.mydb.traders[trader].assort.loyal_level_items) 
        {
            //this.logger.debug(item + " added to " + trader);
            if (modConfig.lvl1Traders) this.db.traders[trader].assort.loyal_level_items[item] = 1;
            else this.db.traders[trader].assort.loyal_level_items[item] = this.mydb.traders[trader].assort.loyal_level_items[item];
        }
    }

    private addTraderSuits(trader: string): void
    {
        //Only do anything if a suits.json file is included for trader in this mod
        if ( typeof this.mydb.traders[trader].suits !== "undefined" )
        {
            //Enable customization for that trader
            this.db.traders[trader].base.customization_seller = true;

            //Create the suits array if it doesn't already exist in SPT database so we can push to it
            if ( typeof this.db.traders[trader].suits === "undefined" ) this.db.traders[trader].suits = [];

            //Push all suits
            for (const suit of this.mydb.traders[trader].suits) this.db.traders[trader].suits.push(suit);
        }
    }

    /*
    private addTrades(GWID: string, GWItem: IGWItem, traders: object, currencies: object): void
    {

        for (const [tradeID, trade] of Object.entries(GWItem.trades))
        {

        }
        
        const items = {
            "_id": "",
            "_tpl": "", 
            "parentId": "",
            "slotId": "",
            "upd": {}
        };

        const barter_scheme = {

        };

        const loyal_level_items = {

        }
    }
    */

    private addLocales(GWID: string, GWItem?: IGWItem, GWArticle?: IGWCustomizationItem): void
    {
        const name =            GWID + " Name";
        const shortname =       GWID + " ShortName";
        const description =     GWID + " Description";

        const isItem = typeof GWItem !== "undefined"
        const GWEntry = isItem ? GWItem : GWArticle;

        for (const localeID in this.db.locales.global) //For each possible locale/language in SPT's database
        {
            let localeEntry: IGWLocale;

            if ( GWEntry.locales )
            {
                if ( localeID in GWEntry.locales) //If the language is entered in GW_items, use that
                {
                    localeEntry = {
                        "Name":           GWEntry.locales[localeID].Name,
                        "ShortName":      GWEntry.locales[localeID].ShortName,
                        "Description":    GWEntry.locales[localeID].Description
                    }
                }

                else //Otherwise use english as the default
                {
                    localeEntry = {
                        "Name":           GWEntry.locales.en.Name,
                        "ShortName":      GWEntry.locales.en.ShortName,
                        "Description":    GWEntry.locales.en.Description
                    }
                }

                //If you are using the old locales
                if (modConfig.oldLocales) this.db.locales.global[localeID].templates[GWID] = localeEntry;

                //Normal
                else
                {
                    this.db.locales.global[localeID][name] =            localeEntry.Name;
                    this.db.locales.global[localeID][shortname] =       localeEntry.ShortName;
                    this.db.locales.global[localeID][description] =     localeEntry.Description;
                }
            }

            else 
            {
                if ( isItem ) this.logger.warning("WARNING: Missing locale entry for item: " + GWID);
                else this.logger.debug("No locale entries for item/clothing: " + GWID)
            }

            //Also add the necessary preset locale entries if they exist
            if ( isItem && GWItem.presets )
            {
                for (const preset in GWItem.presets)
                {
                    if (modConfig.oldLocales) this.db.locales.global[localeID].preset[preset] = {
                        "Name": GWItem.presets[preset]
                    };
                    else
                    {
                        this.db.locales.global[localeID][preset] = GWItem.presets[preset];
                    }
                }
            }
        }
    }
}

module.exports = { mod: new GWitems() }