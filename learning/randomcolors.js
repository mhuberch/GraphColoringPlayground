var randomColor = require('randomcolor'); // import the script
var message = "Hello, World!";
console.log(message);
var red = randomColor({
    luminosity: 'light',
    hue: 'red'
});
var orange = randomColor({
    luminosity: 'light',
    hue: 'orange'
});
var yellow = randomColor({
    luminosity: 'light',
    hue: 'yellow'
});
var green = randomColor({
    luminosity: 'light',
    hue: 'green'
});
var blue = randomColor({
    luminosity: 'light',
    hue: 'blue'
});
var violet = randomColor({
    luminosity: 'light',
    hue: 'violet'
});
var standardColors = [red, orange, yellow, green, blue, violet];
console.log(standardColors);
var colors = randomColor({ count: 5, luminosity: "light" });
console.log(colors);
