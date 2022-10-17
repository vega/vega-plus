import { Mark, Spec } from 'vega';

export function collect_data_usage(full_spec: Spec) {
    let data_usage = new Set();

    // check data entries used in scales
    for (const scale of full_spec.scales) {
        data_usage = new Set([...data_usage, ...check_scale(scale)])
    }

    // check marks including group marks and non-group marks
    for (const mark of full_spec.marks) {
        if (mark.type === 'group') {
            data_usage = new Set([...data_usage, ...check_group_mark(mark)])
        } else {
            data_usage.add(check_non_group_mark(mark))
        }
    }

    return data_usage
}

function check_group_mark(mark) {
    let result = new Set();

    for (const scale of mark.scales) {
        result = new Set([...result, ...check_scale(scale)])
    }

    if (mark.from && mark.from.data) result.add(mark.from.data)

    if (mark.from && mark.from.facet) result.add(mark.from.facet.data)

    for (const subMark of mark.marks) {
        if (subMark.type === 'group') {
            result = new Set([...result, ...check_group_mark(subMark)])
        } else {
            result.add(check_non_group_mark(subMark))
        }
    }

    return result
}

function check_non_group_mark(mark:Mark) {
    if (mark.from?.data) return mark.from?.data
}

function check_scale(scale) {
    const result = new Set();
    if (scale.domain) {
        if (scale.domain.fields) {
            for (const field of scale.domain.fields) {
                if (field.data) result.add(field.data)
            }
        } else if (scale.domain.data) {
            result.add(scale.domain.data)
        }
    } 

    if (scale.range && scale.range.data) {
        result.add(scale.range.data)
    } 

    return result
}
