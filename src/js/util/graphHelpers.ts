"use strict";

import gHelp from './graphHelpers';
import help from './genericHelpers';
import {EdgeImmutPlain} from "../classes/GraphImmut/EdgeImmut";
import NodeImmut, {NodeImmutPlain} from "../classes/GraphImmut/NodeImmut";
import { makeMain } from '@sentry/browser';

interface Degree {
    in: number;
    out: number;
}

const capitalLetters = help.deepFreeze([
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
]) as string[];

export default {
    findVertexDegreesDirectional: (adjacencyMatrix: Array<Array<number>>): Degree[] => {
        // Adjacency stores IDs of edges TO
        const degrees: Degree[] = [];
        adjacencyMatrix.forEach((v, i) => {
            if (i in degrees) {
                degrees[i].out += v.length;
            }
            else {
                degrees[i] = {out: v.length, in: 0};
            }
            v.forEach((outV) => {
                if (outV in degrees) {
                    degrees[outV].in += 1;
                }
                else {
                    degrees[outV] = {in: 1, out: 0};
                }
            });
        });

        return degrees;
    },

    interpolateNodesFromEdges: (edges: EdgeImmutPlain[]): NodeImmutPlain[] => {
        const nodes: NodeImmutPlain[] = [];

        // MH: TODO NOT REALLY CLEAN
        window.settings.changeOption("customColors", true);

        edges.forEach((v) => {
            nodes[v.from] = {id: v.from, label: gHelp.generateLabelFromNumber(v.from)};
            nodes[v.to] = {id: v.to, label: gHelp.generateLabelFromNumber(v.to)};
        });

        return nodes;
    },

    generateLabelFromNumber : (prelabel: number) : string => {
        if (typeof prelabel === "number" && (prelabel >= 0 && prelabel <=25)) {
            return capitalLetters[prelabel];
        } else {
            return prelabel.toString();
        }
    },

    toggleNodeColor : (node: NodeImmut) : string | undefined => {
        
        const customColorPalleteArray = ["DEFAULT", "#ff3f3f", "#ffbf64", "#ffff00", "#00ff80", "#f964ff"];
        const customColorPalleteInverted = {
            "#ff3f3f": 1,
            "#ffbf64": 2,
            "#ffff00": 3,
            "#00ff80": 4,
            "#f964ff": 5
        };

        const currentColor = node.getAttribute('color');

        let currentIndex = 0;        

        if (currentColor === null || currentColor === undefined) {
            currentIndex = 0;
        }
        else {
            const currentColorString = currentColor as string;
            currentIndex = customColorPalleteArray.indexOf(currentColorString);
        }

        if (currentIndex === 5 || currentIndex < 0) {
            return undefined;
        }

        return customColorPalleteArray[(currentIndex+1)%6];
    }
};
