#! /usr/bin/env node 
const { loadImage } = require('canvas');
const url = require('url');
const fetch = require('node-fetch');
const express = require('express')
const app = express()
var stream = require('stream');
const {drawRoute} = require('./helpers')

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
    const resolution = data.map.resolution
    const route = data.courses.map(c=>c.controls)
    const mapImg = await loadImage(mapUrl)
    const [outCanvas, bounds] = drawRoute(mapImg, bound, route, resolution)
    const filename = `map_${bounds[3].lat}_${bounds[3].lon}_${bounds[2].lat}_${bounds[2].lon}_${bounds[1].lat}_${bounds[1].lon}_${bounds[0].lat}_${bounds[0].lon}_.jpeg`
    const outBuffer = outCanvas.toBuffer('image/jpeg', 0.8);
    return [filename, outBuffer];
}

const getMap = async (req, res, next) => {
    const liveloxUrl = req.body.url;
    if (!liveloxUrl.startsWith('https://www.livelox.com/')) { 
        return res.status(400).send('invalid url domain '+liveloxUrl );
    }
    try {
        const [filename, buffer] = await main(liveloxUrl)
        var readStream = new stream.PassThrough();
        readStream.end(buffer);
        res.set('Content-disposition', 'attachment; filename=' + filename);
        res.set('Content-Type', 'image/jpeg');
        readStream.pipe(res);
    } catch (e) {
        return res.status(500).send('Something went wrong...');
    }
}

app.use(express.urlencoded());
app.use(express.json())

app.post('/api/get-map', getMap)

module.exports = app
