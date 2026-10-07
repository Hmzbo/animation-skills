import {Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, createRef, easeOutCubic, sequence, waitFor} from '@motion-canvas/core';

// Staggered bar chart: labels fade in, bars grow with easing, values pop in.
// The canonical "animated data viz" pattern — keep bar math in one place.
export default makeScene2D(function* (view) {
  view.fill('#0f172a');

  const rows = [
    {label: 'React', value: 25.0, color: '#61dafb'},
    {label: 'Vue', value: 4.5, color: '#42b883'},
    {label: 'Svelte', value: 1.2, color: '#ff3e00'},
  ];
  const max = Math.max(...rows.map(r => r.value));
  const barFor = (v: number) => (v / max) * 600;

  const labels = rows.map(() => createRef<Txt>());
  const bars = rows.map(() => createRef<Rect>());
  const values = rows.map(() => createRef<Txt>());

  rows.forEach((row, i) => {
    const y = -120 + i * 120;
    view.add(
      <Txt
        ref={labels[i]}
        text={row.label}
        x={-380}
        y={y}
        fontSize={36}
        fontWeight={600}
        fill={'#ffffff'}
        opacity={0}
      />,
    );
    view.add(
      <Rect
        ref={bars[i]}
        x={-280 + barFor(row.value) / 2}
        y={y}
        width={0}
        height={56}
        radius={8}
        fill={row.color}
      />,
    );
    view.add(
      <Txt
        ref={values[i]}
        text={`${row.value.toFixed(1)}M`}
        x={-260 + barFor(row.value)}
        y={y}
        fontSize={28}
        fill={'#94a3b8'}
        opacity={0}
      />,
    );
  });

  yield* sequence(0.15, ...labels.map(ref => ref().opacity(1, 0.3)));
  yield* sequence(
    0.2,
    ...rows.map((row, i) => bars[i]().width(barFor(row.value), 1, easeOutCubic)),
  );
  yield* sequence(0.1, ...values.map(ref => ref().opacity(1, 0.3)));
  yield* waitFor(1.5);

  // Clear the stage so the next scene starts clean.
  yield* all(
    ...labels.map(ref => ref().opacity(0, 0.3)),
    ...bars.map(ref => ref().opacity(0, 0.3)),
    ...values.map(ref => ref().opacity(0, 0.3)),
  );
});
