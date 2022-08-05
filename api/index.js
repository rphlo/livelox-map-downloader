#! /usr/bin/env node 
const { loadImage } = require('canvas')
const url = require('url')
const fetch = require('node-fetch')
const express = require('express')
const stream = require('stream')
const { drawRoute, saveKMZ } = require('./helpers')

const app = express()

const getMap = async (req, res, next) => {
    const liveloxUrl = req.body.url
    if (!liveloxUrl.startsWith('https://www.livelox.com/')) { 
        return res.status(400).send('invalid url domain')
    }
    let classId = ''
    try {
        classId = url.parse(liveloxUrl, true).query.classId
    } catch (e) {
        return res.status(400).send('no class id provided' )
    }
    let data = {}
    try {
        const res = await fetch("https://www.livelox.com/Data/ClassInfo", {
            "headers": {
                "accept": "application/json",
                "content-type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            },
            "body": JSON.stringify({
                "classIds":[classId],
                "courseIds":null,
                "relayLegs":[],
                "relayLegGroupIds":[],
                "includeMap":true,
                "includeCourses":true,
                "skipStoreInCache":false
            }),
            "method": "POST"
        });
        data = await res.json()
    } catch (e) {
        return res.status(400).send('could not reach livelox server')
    }
    const eventData = data.general
    const blobUrl = eventData?.classBlobUrl
    if (!blobUrl) {
        return res.status(400).send('cannot not figure blob url')
    }
    let blobData = null
    try {
        const res = await fetch(blobUrl, {
            "headers": {
                "accept": "application/json",
                "content-type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            }
        });
        blobData = await res.json()
    } catch (e) {
        return res.status(400).send('could not reach blob url')
    }

    let mapUrl, mapBound, mapResolution, route, mapName
    try {
        mapData = blobData.map
        mapUrl = mapData.url;
        mapBound = mapData.boundingQuadrilateral.vertices
        mapResolution = mapData.resolution
        route = blobData.courses.map((c) => c.controls)
        mapName = mapData.name
    } catch (e) {
        return res.status(400).send('could not parse livelox data')
    }
    try {
        const mapImg = await loadImage(mapUrl)
        const [outCanvas, bounds] = drawRoute(mapImg, mapBound, route, mapResolution)
        const imgBlob = outCanvas.toBuffer('image/jpeg', 0.8)
        let buffer
        let mime
        let filename
        if (!req.body.type || req.body.type === 'jpeg') {
            buffer = imgBlob
            mime = 'image/jpeg'
            filename = `${mapName}_${bounds[3].lat}_${bounds[3].lon}_${bounds[2].lat}_${bounds[2].lon}_${bounds[1].lat}_${bounds[1].lon}_${bounds[0].lat}_${bounds[0].lon}_.jpeg`
        } else if(req.body.type === 'kmz') {
            buffer = await saveKMZ(
                mapName,
                {
                    top_left: bounds[3],
                    top_right: bounds[2],
                    bottom_right: bounds[1],
                    bottom_left: bounds[0]
                },
                imgBlob
            )
            mime = 'application/vnd.google-earth.kmz'
            filename = `${mapName}.kmz`
        } else {
            return res.status(400).send('invalid type' )
        }
        var readStream = new stream.PassThrough()
        readStream.end(buffer)
        res.set('Content-disposition', 'attachment; filename="' + filename.replace(/\\/g, '_').replace(/"/g, '\\"') + '"')
        res.set('Content-Type', mime)
        readStream.pipe(res)
    } catch (e) {
        return res.status(500).send('Something went wrong... '+e.message)
    }
}

app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.post('/api/get-map', getMap)

module.exports = app
