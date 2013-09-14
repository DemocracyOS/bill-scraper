var noodlejs = require('noodlejs'),
    noodle = require('noodle'),
    http = require('http');

console.log("----------------------------");
console.log("Plain Noodle");
console.log("----------------------------");
console.log(noodle);
console.log();
console.log();
console.log("----------------------------");
console.log("----------------------------");
console.log("Plain NoodleJS");
console.log("----------------------------");
console.log(noodlejs);
console.log();
console.log();
console.log("----------------------------");
console.log("Noodle with inspect");
console.log("----------------------------");
console.log(util.inspect(noodlejs));
console.log();
console.log();
console.log("----------------------------");
console.log("Plain HTTP (just an example of something working)");
console.log("----------------------------");
console.log(http);
