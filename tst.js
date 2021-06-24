let map = new Map();
map.set('key', 'value1');
console.log(map);

var val = map.get('key');
if (val){
console.log('Final');
}


var val = map.get('key1');
if (val){
console.log('Final1');
}


map.set('key1', 'value1');
console.log(map);

map.delete('key');
console.log(map);

var temp = [1,2,3,4];

console.log(temp.slice(1, 10));
temp.push("Kiwi");
console.log(temp.slice(1, 10));


temp = temp.filter(function(item) {
    return item !== 4
})

console.log(temp);
