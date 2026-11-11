import TL from '../timeline.json';
export const FPS = 30;
export const tl: any = TL;
export const W = 1080, H = 1920;
export const sf = (s: number) => Math.round(s * FPS);
export const shotById = (id: string) => tl.shots.find((s: any) => s.id === id);
/** helpers bound to one shot: local frames of words and cues */
export function shotClock(id: string) {
  const sh = shotById(id);
  if (!sh) throw new Error('no shot ' + id);
  return {
    dur: sh.dur as number,
    from: sh.from as number,
    w: (i: number) => sf(tl.words[i].s) - sh.from,
    we: (i: number) => sf(tl.words[i].e) - sh.from,
    cue: (name: string) => (tl.cues[name] ? sf(tl.cues[name].t) - sh.from : 0),
    ins: (name: string, off = 0) => sf(tl.inserts[name].start + off) - sh.from,
    g: (sec: number) => sf(sec) - sh.from,
  };
}
