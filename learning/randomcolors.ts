var randomColor = require('randomcolor'); // import the script

let message: string = "Hello, World!"
console.log(message)


const red = randomColor({
    luminosity: 'light',
    hue: 'red'
 });

const orange = randomColor({
    luminosity: 'light',
    hue: 'orange'
 });

 const yellow = randomColor({
    luminosity: 'light',
    hue: 'yellow'
 });

 const green = randomColor({
    luminosity: 'light',
    hue: 'green'
 });

const blue = randomColor({
    luminosity: 'light',
    hue: 'blue'
 });

 const violet = randomColor({
    luminosity: 'light',
    hue: 'violet'
 });

const standardColors = [red, orange, yellow, green, blue, violet];

console.log(standardColors)

const colors = randomColor({ count: 5, luminosity: "light" });

console.log(colors);