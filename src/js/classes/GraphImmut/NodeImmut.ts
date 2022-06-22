"use strict";

import help from "../../util/genericHelpers";

export interface NodeImmutPlain {
    id: Readonly<number>;
    label: string;
    [key: string]: any;
    [key: number]: any;
}

const capitalLetters = help.deepFreeze([
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
]) as string[];

export default class NodeImmut {
    private readonly id: Readonly<number>;
    private readonly label: Readonly<string>;
    private readonly attributes: any;

    constructor(id: any, label: null | string = null, extraAttrs: null | any = null) {
        if (label === null) {
            // MH: If the id is an integer number and between 0 and 25, than take a capital letter from the alphabet as label
            if (typeof id === "number" && (id >= 0 && id <=25)) {
                this.label = capitalLetters[id];
            } else {
                this.label = id.toString();
            }
            
        } else {
            this.label = label;
        }

        this.attributes = {};
        if (extraAttrs !== null && typeof extraAttrs === "object") {
            Object.keys(extraAttrs).forEach(key => {
                this.attributes[key] = Object.freeze(extraAttrs[key]);
            });
        }

        this.attributes = Object.freeze(this.attributes);
        this.label = Object.freeze(this.label);
        this.id = Object.freeze(id);

        if (new.target === NodeImmut) {
            Object.freeze(this);
        }
    }

    toPlain(): NodeImmutPlain {
        const toReturn: NodeImmutPlain = { id: this.id, label: this.label };
        Object.keys(this.attributes).forEach(key => {
            if (!(key in toReturn)) {
                toReturn[key] = this.attributes[key];
            }
        });

        return toReturn;
    }

    getID(): Readonly<number> {
        return this.id;
    }

    getLabel(): Readonly<string> {
        return this.label;
    }

    getAttribute(attribute: string | number): any {
        if (attribute in this.attributes) {
            return this.attributes[attribute];
        }

        return null;
    }

    getAllAttributes(): { [key: string]: any; [key: number]: any } {
        return this.attributes;
    }

    editNode(label: any = null, extraAttrs: any = null): NodeImmut {
        if (label === null) {
            label = this.getLabel();
        }

        // Merge existing and new attributes favoring the new
        const attributes = Object.assign({}, this.attributes);
        if (extraAttrs !== null) {
            Object.keys(extraAttrs).forEach(key => {
                attributes[key] = extraAttrs[key];
            });
        }

        return new NodeImmut(this.getID(), label, attributes);
    }
}
