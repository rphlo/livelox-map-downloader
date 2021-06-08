const {createCanvas} = require('canvas');
const { LatLon, cornerCalTransform } = require('./utils');

const drawRoute = (img, origBounds, route) => {
    const canvas =  createCanvas(img.width*2, img.height*2);
    const bounds = origBounds.map(p=>new LatLon(p.latitude, p.longitude))
    const ctx = canvas.getContext('2d');
  
    // draw a background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  
    ctx.drawImage(img, 0, 0, Math.round(canvas.width), Math.round(canvas.height));
  
    const weight = 6;
  
    const canvas2 = createCanvas(canvas.width, canvas.height);
    const ctx2 = canvas2.getContext('2d');

    const transform = cornerCalTransform(
        canvas.width,
        canvas.height,
        bounds[3],
        bounds[2],
        bounds[1],
        bounds[0]
    );
      
    ctx2.lineWidth = weight;
    const circleSize = 30
    ctx2.strokeStyle = 'purple';
    ctx2.beginPath();
    let prevPt = null
    const routePts = route.map(p => {
        const loc = new LatLon(p.control.position.latitude, p.control.position.longitude);
        const pt = transform(loc);
        return pt
    })
    for(let i=0; i < route.length-1; i++) {
        // avoid division by zero
        if (routePts[i].x === routePts[i+1].x) {
            routePts[i].x -= 0.0001
        }

        StartFromA = routePts[i].x < routePts[i+1].x
        ptA = StartFromA ? routePts[i] : routePts[i+1]
        ptB = StartFromA ? routePts[i+1] : routePts[i]
        angle = Math.atan((ptB.y - ptA.y) / (ptB.x - ptA.x))
        if (i === 0) {
            let ptS = ptB;
            if (StartFromA) {
                ptS = ptA;
            }
            ctx2.moveTo(Math.round(ptS.x - (StartFromA ? -1: 1) * circleSize * Math.cos(angle)), Math.round(ptS.y  - (StartFromA ? -1: 1) * circleSize * Math.sin(angle)))
            ctx2.lineTo(Math.round(ptS.x - (StartFromA ? -1: 1) * circleSize * Math.cos(angle + 2*Math.PI / 3)), Math.round(ptS.y  - (StartFromA ? -1: 1) * circleSize * Math.sin(angle + 2*Math.PI / 3)))
            ctx2.lineTo(Math.round(ptS.x - (StartFromA ? -1: 1) * circleSize * Math.cos(angle - 2*Math.PI / 3)), Math.round(ptS.y  - (StartFromA ? -1: 1) * circleSize * Math.sin(angle - 2*Math.PI / 3)))
            ctx2.lineTo(Math.round(ptS.x - (StartFromA ? -1: 1) * circleSize * Math.cos(angle)), Math.round(ptS.y  - (StartFromA ? -1: 1) * circleSize * Math.sin(angle)))
        }
        ctx2.moveTo(Math.round(ptA.x + circleSize * Math.cos(angle)), Math.round(ptA.y + circleSize * Math.sin(angle)))
        ctx2.lineTo(Math.round(ptB.x - circleSize * Math.cos(angle)), Math.round(ptB.y - circleSize * Math.sin(angle)))
        let ptO = ptA
        if (StartFromA) {
            ptO = ptB
        }
        ctx2.moveTo(Math.round(ptO.x + circleSize), Math.round(ptO.y))
        ctx2.arc(routePts[i+1].x, routePts[i+1].y, circleSize, 0, 2*Math.PI)
        if (i === route.length-2) {
            ctx2.moveTo(Math.round(ptO.x + circleSize-5), Math.round(ptO.y))
            ctx2.arc(routePts[i+1].x, routePts[i+1].y, circleSize-10, 0, 2*Math.PI)    
        }
    }
    ctx2.stroke();
    ctx.globalAlpha = 0.7;
    ctx.drawImage(canvas2, 0, 0);
    return [canvas, bounds];
  };

module.exports = {
    drawRoute,
}