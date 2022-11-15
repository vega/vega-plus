import {
    Data
  } from 'vega-typings/types/spec';
import { enumSegPlan, ExtendedData } from "./plan_inflation";

type AugmentedData = {
    children? : AugmentedData[]
} & Data
  & ExtendedData

type Plan = {
    sql: {};
    vega: {};
    hybrid: {};
    type: string;
}

export class DataTree {
    dataMap // map from a source to a list of children
    data: AugmentedData[]
    levels
    subPlans = {}
    plans = {}
    all =[]

    constructor(data: AugmentedData[]) {
        this.dataMap = data.reduce((acc, el, i) => {
            acc[el.name] = i;
            return acc;
        }, {});

        // construct a nested tree from the data array
        const nestData = [] 

        this.data = JSON.parse(JSON.stringify(data))
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
                for(const child of this.data[idx].children) {
                    curr.push([this.dataMap[child.name], level + 1]);
                }
            }
            
        }
        console.log(this.levels)
    }

    enumnerateDataEntries() {
        for (const data_entry of this.data) {
            this.subPlans[data_entry.name] = enumSegPlan(data_entry)
        }
        console.log(JSON.stringify(this.subPlans), "sub")

        if (this.levels.length && this.levels[0].length) {
            for (const root_idx of this.levels[0]) {
                let root = this.data[root_idx].name

                let ret = this.enumerateRecursion(root, {sql:{}, vega:{}, hybrid:{}}, true)
                console.log(ret)
            }
        }
    }

    
    enumerateRecursion(curr: string | null, curr_plans, root= false) {
        let next_plans: Plan = {sql:{}, vega:{}, hybrid:{}, type: 'sql'};

        if (root) {
            // if (this.subPlans[curr].vega.length != 0) throw new Error('root cannot have pure vega');

            for (const [id, next_plan] of Object.entries(this.subPlans[curr].hybrid)) {
                if (!next_plans.vega [id]) { 
                    next_plans.vega [id] = {plan: next_plan, type:'hybrid'}
                } else {
                    throw new Error('duplicated key')
                } 
            }
            if (this.subPlans[curr].sql.length === 1) {
                let next_plan = [this.subPlans[curr].sql[0]]

                if (!next_plans.vega [`/${curr}_sql`]) { 
                    next_plans.vega [`/${curr}_sql`] = {plan: next_plan, type:'sql'}
                } else {
                    throw new Error('duplicated key')
                }

                if (!next_plans.sql [`/${curr}_sql`]) { 
                    next_plans.sql [`/${curr}_sql`] = {plan: next_plan, type:'sql'}
                } else {
                    throw new Error('duplicated key')
                }

                if (!next_plans.hybrid [`/${curr}_sql`]) { 
                    next_plans.hybrid [`/${curr}_sql`] = {plan: next_plan, type:'sql'}
                } else {
                    throw new Error('duplicated key')
                }
            }
        } else {

            for (const [prefix, curr_plan] of Object.entries(curr_plans.hybrid)) {
                let new_plan: Plan = JSON.parse(JSON.stringify(curr_plan))

                let parent = null;
                console.log(new_plan, "new planß")
                for (const i of new_plan['plan']) {
                    if (i['name'] === this.data[this.dataMap[curr]]['source']) {
                        parent = i
                        break
                    }
                }
                let parent_query;
                if (curr_plan['type'] === 'sql') {
                    debugger;

                    parent_query = parent.transform[0].query.signal;
                } else {
                    throw new Error('should be of type sql')
                }

                for (const [id, next_plan] of Object.entries(this.subPlans[curr].hybrid)) {
                    let copy: AugmentedData = JSON.parse(JSON.stringify(next_plan))
                    const query = copy.transform[0]['query'].signal
                    const new_query = query.replace('$SOURCE$', ` (${parent_query}) ${this.data[this.dataMap[curr]]['source']}`)
                    delete copy['source']
                    copy.transform[0]['query'].signal = new_query;
                    let new_plan = JSON.parse(JSON.stringify(curr_plan)).plan
                    new_plan.push(copy)

                    next_plans.vega[prefix + `/${id}`] = {plan: JSON.parse(JSON.stringify(new_plan)), type:'hybrid'}

                    if (!this.data[this.dataMap[curr]].children) {
                        // should be turning to the next children
                        next_plans.hybrid[prefix + `/${id}`] = {plan: JSON.parse(JSON.stringify(new_plan)), type:'sql'}
                        next_plans.sql[prefix + `/${id}`] = {plan: JSON.parse(JSON.stringify(new_plan)), type:'sql'}
                    } 
                }
            }

            for (const [prefix, curr_plan] of Object.entries(curr_plans.vega)) {

                let copy:AugmentedData[] = JSON.parse(JSON.stringify(curr_plan)).plan
                copy.push(this.subPlans[curr].vega[0])
                next_plans.vega[prefix + `/${curr}_vega`] = {plan: copy, type:'vega'}       
                
                if (!this.data[this.dataMap[curr]].children) {
                    // should be turning to the next children
                    let parent = null;
                    for (const i of curr_plan['plan']) {
                        if (i['name'] === this.data[this.dataMap[curr]]['source']) {
                            parent = i
                            break
                        }
                    }

                    if (parent['transform'].length === 1 && parent['transform'][0].query) {
                        next_plans.sql[prefix + `/${curr}_vega`] = {plan: copy, type:'sql'}
                        next_plans.hybrid[prefix + `/${curr}_vega`] = {plan: copy, type:'sql'}
                    }

                }
            }

            for (const [prefix, curr_plan] of Object.entries(curr_plans.sql)) {

                if (!this.subPlans[curr].sql.length) break
                let parent = null;
                for (const i of curr_plan['plan']) {
                    if (i['name'] === this.data[this.dataMap[curr]]['source']) {
                        parent = i
                        break
                    }
                }

                let parent_query;
                if (curr_plan['type'] === 'sql') {
                    parent_query = parent.transform[0].query.signal;
                } else {
                    throw new Error('should be of type sql')
                }

                let new_plan: any[] = JSON.parse(JSON.stringify(curr_plan)).plan
                let copy = new_plan['plan']
                console.log(copy)
                const query = this.subPlans[curr].sql[0].transform[0].query.signal
                const new_query = query.replace('$SOURCE$', ` (${parent_query}) ${this.data[this.dataMap[curr]]['source']}`)
                const new_data = {
                    name: this.subPlans[curr].sql[0].name,
                    id: prefix + `/${curr}_sql`,
                    transform: [{type:"dbtransform", query:{signal: new_query}}]
                }

                new_plan.push(new_data)

                next_plans.sql[prefix + `/${curr}_sql`] = {plan: JSON.parse(JSON.stringify(new_plan)), type:'sql'}
                next_plans.hybrid[prefix + `/${curr}_sql`] = {plan: JSON.parse(JSON.stringify(new_plan)), type:'sql'}
                next_plans.vega[prefix + `/${curr}_sql`] = {plan: JSON.parse(JSON.stringify(new_plan)), type:'sql'}
            }
        }

        if (!this.data[this.dataMap[curr]].children || !this.data[this.dataMap[curr]].children.length) {
            if (curr === this.data[this.levels[this.levels.length-1][this.levels[this.levels.length-1].length-1]].name) {
                this.plans = next_plans.vega
            }
            console.log((JSON.stringify(next_plans)))
            return next_plans
        } 

        for (const child of this.data[this.dataMap[curr]].children) {
            next_plans = this.enumerateRecursion(child.name, JSON.parse(JSON.stringify(next_plans)))
            
        }

        console.log(next_plans)
    }

} 
