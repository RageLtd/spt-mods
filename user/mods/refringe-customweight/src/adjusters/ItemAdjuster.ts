import type { DatabaseServer } from "@spt/servers/DatabaseServer";
import type { ILogger } from "@spt/models/spt/utils/ILogger";
import { DependencyContainer } from "tsyringe";
import { Configuration } from "../types";

/**
 * The `ItemAdjuster` class is responsible for orchestrating adjustments to item weights according to a configuration.
 */
export class ItemAdjuster {
    public container: DependencyContainer;
    public logger: ILogger;
    public config: Configuration;

    /**
     * Constructor initializes the item weight adjustment process.
     */
    constructor(container: DependencyContainer, config: Configuration) {
        this.container = container;
        this.logger = container.resolve<ILogger>("WinstonLogger");
        this.config = config;
    }

    /**
     * Main method that orchestrates the item weight adjustment.
     */
    public adjustItemWeights(): void {
        const items = this.container.resolve<DatabaseServer>("DatabaseServer").getTables().templates.items;

        // Keep track of the number of items that have had their weight adjusted.
        let itemCount = 0;
        let parentCount = 0;
        let specificCount = 0;

        for (const item in items) {
            // Is this item on the blacklist?
            if (
                this.config.item.blacklist.includes(items[item]._id) ||
                this.config.item.blacklist.includes(items[item]._name)
            ) {
                if (this.config.general.debug) {
                    this.logger.log(
                        `CustomWeight: Item "${items[item]._name}" was found on the configuration blacklist. Skipping.`,
                        "gray"
                    );
                }
                continue;
            }

            // Does this item have a weight property?
            if (Object.prototype.hasOwnProperty.call(items[item]._props, "Weight")) {
                // Save the original weight.
                const originalWeight = items[item]._props.Weight;

                // Adjust the weight using the generic relative weight modifier.
                const newWeight: number = this.calculateRelativePercentage(this.config.item.adjustment, originalWeight);
                if (newWeight !== originalWeight) {
                    items[item]._props.Weight = newWeight;
                    itemCount++;

                    if (this.config.general.debug) {
                        this.logger.log(
                            `CustomWeight: Item "${items[item]._name}" had it's original weight of ${originalWeight} adjusted to ${newWeight} via generic modifier.`,
                            "gray"
                        );
                    }
                }

                // Check to see if this item has a parent ID with a relative weight modifier.
                if (Object.prototype.hasOwnProperty.call(this.config.item.parentAdjustments, items[item]._parent)) {
                    const parentAdjustment = this.config.item.parentAdjustments[items[item]._parent];
                    const newWeight: number = this.calculateRelativePercentage(parentAdjustment, originalWeight);
                    if (newWeight !== originalWeight) {
                        items[item]._props.Weight = newWeight;
                        parentCount++;

                        if (this.config.general.debug) {
                            this.logger.log(
                                `CustomWeight: Item "${items[item]._name}" had it's original weight of ${originalWeight} adjusted to ${newWeight} via parent modifier.`,
                                "gray"
                            );
                        }
                    }
                }

                // Check to see if this item has a specific weight override.
                if (
                    Object.prototype.hasOwnProperty.call(this.config.item.specificAdjustments, items[item]._name) ||
                    Object.prototype.hasOwnProperty.call(this.config.item.specificAdjustments, items[item]._id)
                ) {
                    const specificAdjustment: number =
                        this.config.item.specificAdjustments[items[item]._name] ||
                        this.config.item.specificAdjustments[items[item]._id];
                    if (specificAdjustment !== items[item]._props.Weight) {
                        items[item]._props.Weight = specificAdjustment;
                        specificCount++;

                        if (this.config.general.debug) {
                            this.logger.log(
                                `CustomWeight: Item "${items[item]._name}" had it's original weight of ${originalWeight} adjusted to ${specificAdjustment} via specific modifier.`,
                                "gray"
                            );
                        }
                    }
                }
            }
        }

        if (this.config.item.adjustment !== 0 && itemCount > 0) {
            this.logger.log(
                `CustomWeight: All ${itemCount} items have had their weight adjusted by ${this.config.item.adjustment > 0 ? "+" : ""}${this.config.item.adjustment}%.`,
                "cyan"
            );
        } else if (parentCount > 0) {
            this.logger.log(
                `CustomWeight: ${parentCount} item${parentCount === 1 ? "" : "s"} have had their weight adjusted due to their parent ID.`,
                "cyan"
            );
        } else if (specificCount > 0) {
            this.logger.log(
                `CustomWeight: ${specificCount} ${specificCount === 1 ? "item has" : "items have"} had a specific weight set.`,
                "cyan"
            );
        } else if (itemCount === 0 && parentCount === 0 && specificCount === 0) {
            this.logger.log("CustomWeight: No item weights adjusted.", "cyan");
        }
    }

    /**
     * Adjust a number by a relative percentage.
     * Example: 50 = 50% increase (0.5 changed to 0.75)
     *         -50 = 50% decrease (0.5 changed to 0.25)
     *
     * @param percentage The relative percentage to adjust value by.
     * @param value The number to adjust.
     * @returns number
     */
    private calculateRelativePercentage(percentage: number, value: number): number {
        const increase = percentage >= 0;
        const differencePercentage = increase ? percentage : percentage * -1;
        const difference = (differencePercentage / 100) * value;
        let adjustedValue = increase ? value + difference : value - difference;

        // Round the new value to max 4 decimal places.
        adjustedValue = Number((adjustedValue * 10000).toFixed(0)) / 10000;

        // If the value is less than 0, return 0.
        return adjustedValue > 0 ? adjustedValue : 0;
    }
}
