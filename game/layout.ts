// Label anchors also position the Phaser islands and their pointer targets.
export function anchors(compact: boolean) {
  return compact
    ? [
        { x: 0.25, y: 0.31 },
        { x: 0.75, y: 0.31 },
        { x: 0.25, y: 0.79 },
        { x: 0.75, y: 0.79 },
      ]
    : [
        { x: 0.145, y: 0.69 },
        { x: 0.385, y: 0.52 },
        { x: 0.615, y: 0.7 },
        { x: 0.855, y: 0.54 },
      ];
}
