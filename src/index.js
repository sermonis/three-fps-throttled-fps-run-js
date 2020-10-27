
import Meta from 'es-pack-js/src/meta';

class FpsRun {
    constructor(opts={}) {
        this.stopped = false;
        this.frameCount = 0;
        this.fpsInterval = null;
        this.startTime = null;
        this.then = null;
        this.animFunc = null;
        this.log = opts.log;
        this.logFunc = opts.logFunc;
        this.isNodeJS = Meta.isNodeJS();
        if (this.isNodeJS) {
            // https://stackoverflow.com/questions/23003252/window-performance-now-equivalent-in-nodejs
            // Node >= v8.5.0
            const { performance } = require('perf_hooks');
            this.perf = performance;
        } else {
            this.perf = window.performance;
        }

        // animate(now) is recursively called by rAF(), so
        // to preserve "this" pointing to the class instance,
        // define animate() in constructor with the => syntax
        this.animate = (now) => {
            // console.log('animate(): now:', now);
            if (this.stopped) return;

            if (this.isNodeJS) {
                // https://stackoverflow.com/questions/30442896/server-side-implementation-of-requestanimationframe-in-nodejs
                setImmediate(this.animate, this.perf.now());
            } else {
                window.requestAnimationFrame(this.animate);
            }

            // calc elapsed time since last loop
            let elapsed = now - this.then;
            // if enough time has elapsed, draw the next frame
            if (elapsed > this.fpsInterval) {
                // Get ready for next frame by setting then=now, but...
                // Also, adjust for fpsInterval not being multiple of 16.67
                this.then = now - (elapsed % this.fpsInterval);

                // draw stuff here
                this.animFunc();

                if (this.log) {
                    // #seconds since start and achieved fps.
                    let sinceStart = now - this.startTime;
                    let currentFps = Math.round(1000 / (sinceStart / ++this.frameCount) * 100) / 100;
                    let msg = "Elapsed time= " + Math.round(sinceStart / 1000 * 100) / 100 + " secs @ " + currentFps + " fps.";
                    let log = this.logFunc ? this.logFunc : console.log;
                    log(msg);
                }
            }
        };
    }
    start(f, fps) {
        this.animFunc = f;
        this.fpsInterval = 1000 / fps;
        this.then = this.perf.now();
        if (this.log) {
            this.startTime = this.then;
        }
        this.animate();
    }
    stop() {
        this.stopped = true;
    }
    resume() {
        this.stopped = false;
        this.animate();
    }
}

export default FpsRun;
