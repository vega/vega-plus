import { aggregateTransformToSql } from "./aggregate";
import { filterTransformToSql } from "./filter";
import { collectTransformToSql } from "./collect";
import { collectNonTransformFields, vegaNonTransformToSql } from "./non_transform"; 
import { projectTransformToSql } from "./project"
import { stackTransformToSql } from "./stack"
import {Spec, transforms, Transforms} from "vega"
import {
    Data
  } from 'vega-typings/types/spec';
import { ExtendedData } from "./plan_inflation";

class DataEntry {
    idx: number
    name: string
    source: string | null
    children: DataEntry[]

    constructor(idx:number, name:string, source?:string) {
        this.idx = idx
        this.name = name
        this.source =  source ? (source === "root" ? null: source) :null
        this.children = []
    }
}


type AugmentedData = {
    children? : AugmentedData[]
} & Data

export type ExecutionPlan = {

}

export function spec_enumerate(spec) {

    let data_entry = spec.data;

    if (!data_entry.children || data_entry.children.length == 0) return data_entry.plan 

    let plan = {sql:[], vega:[], hybrid:[]};
    let all_vega = true;

    for (var i = 0; i < data_entry.children.length; i++) {

    }

}

export function enum_sub_tree(root) {

    for (var i = 0; i < root.children.length; i++) {

    }
}

export class DataTree {
    dataMap
    data: AugmentedData[]
    levels

    constructor(data: AugmentedData[]) {
        this.dataMap = data.reduce((acc, el, i) => {
            acc[el.name] = i;
            return acc;
        }, {});

        // construct a nested tree from the data array
        const nestData = [] 

        this.data = data
        this.data.forEach(el => {
            if ('source' in el && typeof el.source === 'string') {
                if (!this.data[this.dataMap[el.source]].children) {
                    this.data[this.dataMap[el.source]].children = []
                }
                this.data[this.dataMap[el.source]].children.push(el)

            } else {
                nestData.push(el)
            }
        });


        let curr = nestData.map(x => [this.dataMap[x.name],0]) 
        this.levels = []


        while (curr.length) {
            console.log(curr) 

            let [idx, level] = curr.shift();

            if(this.levels.length <= level) {
                this.levels[level] = [];
            }
            this.levels[level].push(idx);
            
            console.log(idx)
            if (this.data[idx].children !== undefined){
                for(const child of data[idx].children) {
                    curr.push([this.dataMap[child.name], level + 1]);
                }
            }
            
        }
    }

    

} 


export function specToLevels(data: AugmentedData[]) {
    // TODO NOW: merge data entries where the intermidiate data source is not really needed

    // Map element name to arr index
    const dataMap = data.reduce((acc, el, i) => {
        acc[el.name] = i;
        return acc;
    }, {});

    // construct a nested tree from the data array
    const nestData = [] 

    data.forEach(el => {
        if ('source' in el && typeof el.source === 'string') {
            if (!data[dataMap[el.source]].children) {
                data[dataMap[el.source]].children = []
            }
            data[dataMap[el.source]].children.push(el)

        } else {
            nestData.push(el)
        }
    });


    let curr = nestData.map(x => [dataMap[x.name],0]) 
    let levels = []


    while (curr.length) {
        console.log(curr) 

        let [idx, level] = curr.shift();

        if(levels.length <= level) {
            levels[level] = [];
        }
        levels[level].push(idx);
        
        console.log(idx)
        if (data[idx].children !== undefined){
            for(const child of data[idx].children) {
                curr.push([dataMap[child.name], level + 1]);
            }
        }
        
    }

    return levels
}

