let googleHelperLib = require('./lib/googleHelperLib')
let googleHelper = googleHelperLib.googleHelper;
let googleExpose = new googleHelper({sAdress: "Straße der Pariser Kommune 21,10243 Berlin, Friedrichshain (Friedrichshain)"})

googleExpose.fnGetCoordinates().then(() => {
    console.log(googleExpose);
})