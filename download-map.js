#! /usr/bin/env node 
const { loadImage } = require('canvas');
const fs = require('fs')
const url = require('url');
const fetch = require('node-fetch');
const { drawRoute } = require('./helpers')

const main = async (liveloxUrl) => {
    const classId = url.parse(liveloxUrl, true).query.classId;
    const res = await fetch("https://www.livelox.com/Data/ClassBlob", {
        "headers": {
            "accept": "application/json",
            "content-type": "application/json",
        },
        "body": JSON.stringify({"classIds":[classId],"courseIds":null,"relayLegs":[],"relayLegGroupIds":[],"routeReductionProperties":{"distanceTolerance":1,"speedTolerance":0.1},"includeMap":true,"includeCourses":true,"skipStoreInCache":false}),
        "method": "POST"
    });
    const data = await res.json()
    const mapUrl = data.map.url;
    const bound = data.map.boundingQuadrilateral.vertices
    const route = data.courses.map(c=>c.controls)
    const mapImg = await loadImage(mapUrl)
    const [outCanvas, bounds] = drawRoute(mapImg, bound, route)
    fs.writeFileSync(`map_${bounds[3].lat}_${bounds[3].lon}_${bounds[2].lat}_${bounds[2].lon}_${bounds[1].lat}_${bounds[1].lon}_${bounds[0].lat}_${bounds[0].lon}_.jpeg`, outCanvas.toBuffer('image/jpeg', 0.8));
}

if(process.argv.length < 3) {
    console.error('Usage: ./download-map.js <livelox-url>')
} else {
    const args = process.argv.slice(2)
    main(...args)
}
