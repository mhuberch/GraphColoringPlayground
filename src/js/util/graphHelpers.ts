"use strict";

import gHelp from './graphHelpers';
import help from './genericHelpers';
import {EdgeImmutPlain} from "../classes/GraphImmut/EdgeImmut";
import NodeImmut, {NodeImmutPlain} from "../classes/GraphImmut/NodeImmut";
import GraphImmut from '../classes/GraphImmut/GraphImmut';

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

    compareColor : (color1: string | undefined | null, color2: string | undefined | null) => {
        if (color1 === null || color1 === undefined) {
            color1 = "DEFAULT";
        }
        if (color2 === null || color2 === undefined) {
            color2 = "DEFAULT";
        }

        return color1 === color2;

    },

    // "not colored": "DEFAULT",
    // "1: red": "#ff3f3f",
    // "2: orange": "#ffbf64",
    // "3: yellow": "#ffff00",
    // "4: green": "#00ff80",
    // "5: blue": "#66ccff",
    // "6: violet": "#f964ff"

    toggleNodeColor : (node: NodeImmut) : string | undefined => {
        
        const customColorPalleteArray = ["DEFAULT", "#ff3f3f", "#ffbf64", "#ffff00", "#00ff80", "#66ccff", "#f964ff"]; //'  ', '#97c2fc'];

        const currentColor = node.getAttribute('color');

        let currentIndex = 0;        

        if (currentColor === null || currentColor === undefined) {
            currentIndex = 0;
        }
        else {
            const currentColorString = currentColor as string;
            currentIndex = customColorPalleteArray.indexOf(currentColorString);
        }

        if (currentIndex === 6 || currentIndex < 0) {
            return undefined;
        }

        if (currentIndex === 7) {
            currentIndex = 0;
        }

        return customColorPalleteArray[(currentIndex+1)%7];
    },

    checkColoringByNumber : (color: number[], G: GraphImmut): boolean => {

        const nodes = G.getAllNodes(true) as NodeImmut[];

        const V = G.getNumberOfNodes();
        for (let v = 0; v < V; v++) {
            const vertexAdjacency = G.getNodeAdjacency(v);
            const currentColor = color[v];

            for (const i of vertexAdjacency) {
                const conflict  = (currentColor === color[i]);
                if (conflict && i > v) {
                    return false;
                }
            }
        }
        
        return true;

    },

    nextColorIsSafe : (curNode: number, G: GraphImmut, color : number[], curColor: number): boolean => {
        const V = G.getNumberOfNodes();
        const vertexAdjacency = G.getNodeAdjacency(curNode);

        for (let i = 0; i < vertexAdjacency.length; i++) {
            if (color[vertexAdjacency[i]] === curColor) {
                return false
            }
        }

        return true;

    }

    

};
