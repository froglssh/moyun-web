"""Record the opening sequence of 墨韵 (painting + qin audio) to MP4.

Usage:
  python3 -m http.server 8000          # in the repo root
  python3 scripts/record.py --url http://127.0.0.1:8000/ --out media

Needs: playwright (python) with Chromium, ffmpeg.
"""
import argparse, asyncio, base64, os, sys, json, shutil, subprocess, tempfile
from playwright.async_api import async_playwright
S = tempfile.mkdtemp(prefix="moyun-rec-")
OUT = "."
URL = "http://127.0.0.1:8000/"
AUDIO_HOOK = r"""
(() => {
  const orig = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function(dest, ...rest){
    const r = orig.call(this, dest, ...rest);
    if (dest instanceof AudioDestinationNode && !window.__rec) {
      const md = this.context.createMediaStreamDestination();
      orig.call(this, md);
      const mr = new MediaRecorder(md.stream, {mimeType:'audio/webm;codecs=opus', audioBitsPerSecond:192000});
      const chunks = []; mr.ondataavailable = e => chunks.push(e.data); mr.start(250);
      window.__rec = {mr, chunks, t0: performance.timeOrigin + performance.now()};
    }
    return r;
  };
})();
"""
async def record(p, name, vw, vh, dpr, maxw, maxh):
    fdir = os.path.join(S, f"frames-{name}"); shutil.rmtree(fdir, ignore_errors=True); os.makedirs(fdir)
    b = await p.chromium.launch(headless=True, args=["--use-gl=angle","--use-angle=metal","--enable-gpu","--ignore-gpu-blocklist","--autoplay-policy=no-user-gesture-required"])
    ctx = await b.new_context(viewport={"width":vw,"height":vh}, device_scale_factor=dpr, color_scheme="light")
    await ctx.add_init_script(AUDIO_HOOK)
    pg = await ctx.new_page()
    cdp = await ctx.new_cdp_session(pg)
    frames = []
    async def on_frame(ev):
        i = len(frames); fn = os.path.join(fdir, f"{i:05d}.jpg")
        with open(fn, "wb") as f: f.write(base64.b64decode(ev["data"]))
        frames.append((fn, ev["metadata"]["timestamp"]))
        try: await cdp.send("Page.screencastFrameAck", {"sessionId": ev["sessionId"]})
        except Exception: pass
    cdp.on("Page.screencastFrame", lambda ev: asyncio.ensure_future(on_frame(ev)))
    await pg.goto("about:blank")
    await cdp.send("Page.startScreencast", {"format":"jpeg","quality":93,"maxWidth":maxw,"maxHeight":maxh,"everyNthFrame":1})
    await pg.goto(URL)
    await pg.wait_for_timeout(250)
    await pg.click("#sound")          # user gesture: turns the qin on before the hand starts painting
    await pg.wait_for_timeout(3000)
    # wait until the painting, poem and seal are finished
    await pg.wait_for_function("document.querySelector('.seal.on') && document.getElementById('paint').textContent==='落笔山水'", timeout=120000, polling=200)
    await pg.wait_for_timeout(4000)
    await cdp.send("Page.stopScreencast")
    await asyncio.sleep(.5)
    audio_b64 = await pg.evaluate("""async () => { const r = window.__rec; if (!r) return null;
      await new Promise(res => { r.mr.onstop = res; r.mr.stop(); });
      const buf = new Uint8Array(await new Blob(r.chunks).arrayBuffer()); let s = '';
      for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
      return JSON.stringify({t0: r.t0, data: btoa(s)}); }""")
    await b.close()
    # drop blank frames before the page painted (about:blank + font load)
    t_first = frames[0][1]
    lst = os.path.join(S, f"list-{name}.txt")
    with open(lst, "w") as f:
        for i, (fn, ts) in enumerate(frames):
            nxt = frames[i+1][1] if i + 1 < len(frames) else ts + 1/30
            f.write(f"file '{fn}'\nduration {max(nxt-ts, 0.001):.4f}\n")
        f.write(f"file '{frames[-1][0]}'\n")
    out = os.path.join(OUT, f"moyun-{name}.mp4")
    cmd = ["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",lst]
    if audio_b64:
        a = json.loads(audio_b64); ap = os.path.join(S, f"audio-{name}.webm")
        with open(ap, "wb") as f: f.write(base64.b64decode(a["data"]))
        off = a["t0"]/1000 - t_first
        cmd += ["-itsoffset", f"{off:.3f}", "-i", ap]
    total = frames[-1][1] - t_first
    vf = f"fps=30,fade=t=in:st=0:d=0.6,fade=t=out:st={total-1.2:.2f}:d=1.2,scale=trunc(iw/2)*2:trunc(ih/2)*2"
    cmd += ["-vf", vf, "-c:v","libx264","-preset","slow","-crf","16","-pix_fmt","yuv420p","-movflags","+faststart"]
    if audio_b64: cmd += ["-af", f"afade=t=out:st={total-1.5:.2f}:d=1.5", "-c:a","aac","-b:a","192k","-shortest"]
    cmd += [out]
    subprocess.run(cmd, check=True)
    print(name, "frames", len(frames), "dur %.1fs" % total, "audio", bool(audio_b64), out)
async def main():
    global OUT, URL
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default=URL)
    ap.add_argument("--out", default=OUT)
    ap.add_argument("formats", nargs="*", default=["16x9", "9x16"])
    a = ap.parse_args(); URL, OUT = a.url, a.out; os.makedirs(OUT, exist_ok=True)
    which = a.formats
    async with async_playwright() as p:
        # CDP screencast in headless Chromium emits CSS-pixel frames and ignores device_scale_factor,
        # so the viewport itself must be the target resolution.
        if "16x9" in which: await record(p, "16x9", 1920, 1080, 1, 1920, 1080)
        if "9x16" in which: await record(p, "9x16", 1080, 1920, 1, 1080, 1920)
asyncio.run(main())
