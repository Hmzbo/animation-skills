import {Txt, makeScene2D} from '@motion-canvas/2d';
import {all, createRef, waitFor} from '@motion-canvas/core';

// Title card: topic title fades/slides in, holds, fades out.
// Mirrors the manim title-band discipline: one centered statement, then clear.
export default makeScene2D(function* (view) {
  view.fill('#0b0e14');

  const title = createRef<Txt>();
  const subtitle = createRef<Txt>();

  view.add(
    <Txt
      ref={title}
      text={'Integrals are area under a curve'}
      fontSize={72}
      fontWeight={700}
      fill={'#ffffff'}
      y={-40}
      opacity={0}
    />,
  );
  view.add(
    <Txt
      ref={subtitle}
      text={'A Motion Canvas title card'}
      fontSize={36}
      fill={'#94a3b8'}
      y={60}
      opacity={0}
    />,
  );

  yield* all(title().opacity(1, 0.6), title().y(-60, 0.6));
  yield* subtitle().opacity(1, 0.4);
  yield* waitFor(1.2);
  yield* all(title().opacity(0, 0.4), subtitle().opacity(0, 0.4));
});
