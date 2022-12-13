import { DataTree } from '../packages/vega-plus-core/src/spec_enumerate';
import { enumSegPlan } from '../packages/vega-plus-core/src/plan_inflation';

var test_cases_1 = [
    {spec_file:'cars_average_sourced', expected: [[0], [1]]},
    {spec_file:'cars_histogram_extent', expected: [[0], [1,2]]},
];
  
var test_cases_2 = [
    {spec_file:'cars_histogram_extent', idx: 2, expected: [[0], [1,2]]},
];

describe.each(test_cases_2)('data plans', ({spec_file, idx, expected}) => {
  
    test(spec_file, async () => {
  
      var spec = require(`../sample_data/specs/specs/${spec_file}.json`);
      
      const data_plans = enumSegPlan(JSON.parse(JSON.stringify(spec.data[idx])))
      console.log(JSON.stringify(data_plans))

      expect(data_plans.sql.length).toEqual(1)
      expect(data_plans.vega.length).toEqual(1)
      expect(Object.keys(data_plans.hybrid).length).toEqual(1)
      
    });
});

describe.each(test_cases_1)('data tree construction', ({spec_file, expected}) => {
  
  test(spec_file, async () => {

    var spec = require(`../sample_data/specs/specs/${spec_file}.json`);

    const tree = new DataTree(spec.data)

    expect(tree.levels).toEqual(expected)
    
  });
});

describe.each(test_cases_2)('data tree enumeration', ({spec_file, expected}) => {
  
  test(spec_file, async () => {

    var spec = require(`../sample_data/specs/specs/${spec_file}.json`);

    const tree = new DataTree(spec.data)

    tree.enumnerateDataEntries()

    console.log(tree.plans)
    expect(Object.keys(tree.plans).length).toEqual(6)
    
  });
});