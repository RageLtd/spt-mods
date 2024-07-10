export interface Configuration {
    general: General;
    item: Item;
}

export interface General {
    enabled: boolean;
    debug: boolean;
}

export interface Item {
    adjustment: number;
    parentAdjustments: { [key: string]: number };
    specificAdjustments: { [key: string]: number };
    blacklist: string[];
}
