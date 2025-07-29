import { optimize } from 'svgo';
import * as prettier from 'prettier';
import { parseSync, stringify } from 'svgson';
import DEFAULT_ATTRS from '../../tools/build-icons/render/default-attrs.json' with { type: 'json' };

/**
 * Optimize SVG with `svgo`.
 * @param {string} svg - An SVG string.
 * @returns {Promise<string>} An optimized svg
 */
async function optimizeSvg(svg: string, path: string) {
  const result = optimize(svg, {
    path,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            convertShapeToPath: {},
            mergePaths: {},
          },
        },
      },
      {
        name: 'removeAttrs',
        params: {
          attrs: '(fill|stroke.*)',
        },
      },
      {
        name: 'convertpath',
        fn: () => {
          return {
            element: {
              enter: (node: any) => {
                if (node.name === 'rect' && node.attributes.rx) {
                  const { x, y, width, height, rx, ry } = node.attributes;

                  const numX = Number(x || 0);
                  const numY = Number(y || 0);
                  const numWidth = Number(width);
                  const numHeight = Number(height);
                  const numRx = Number(rx);
                  const numRy = Number(ry || rx);

                  const d = `
                    M${numX + numRx},${numY}
                    h${numWidth - 2 * numRx}
                    a${numRx},${numRy} 0 0 1 ${numRx},${numRy}
                    v${numHeight - 2 * numRy}
                    a${numRx},${numRy} 0 0 1 ${-numRx},${numRy}
                    h${-numWidth + 2 * numRx}
                    a${numRx},${numRy} 0 0 1 ${-numRx},${-numRy}
                    v${-numHeight + 2 * numRy}
                    a${numRx},${numRy} 0 0 1 ${numRx},${-numRy}
                    z
                  `;

                  delete node.attributes.x;
                  delete node.attributes.y;
                  delete node.attributes.width;
                  delete node.attributes.height;
                  delete node.attributes.rx;
                  delete node.attributes.ry;

                  node.name = 'path';
                  node.attributes.d = d.replace(/\s+/g, ' ');
                }
                if (node.name === 'circle') {
                  const { cx, cy, r } = node.attributes;

                  const numCx = Number(cx);
                  const numCy = Number(cy);
                  const numR = Number(r);

                  const d = `
                    M ${numCx - numR}, ${numCy}
                    a ${numR},${numR} 0 1,0 ${numR * 2},0
                    a ${numR},${numR} 0 1,0 ${-numR * 2},0
                  `;

                  delete node.attributes.cx;
                  delete node.attributes.cy;
                  delete node.attributes.r;

                  node.name = 'path';
                  node.attributes.d = d.replace(/\s+/g, ' ');
                }
              },
            },
          };
        },
      },
    ],
  });

  return result.data;
}

/**
 * Set default attibutes on SVG.
 * @param {string} svg - An SVG string.
 * @returns {string} An SVG string, included with the default attributes.
 */
function setAttrs(svg: string) {
  const contents = parseSync(svg);

  contents.attributes = {
    ...DEFAULT_ATTRS,
    width: String(DEFAULT_ATTRS.width),
    height: String(DEFAULT_ATTRS.height),
    "stroke-width": String(DEFAULT_ATTRS['stroke-width']),
    ...contents.attributes,
  };

  return stringify(contents);
}

/**
 * Process SVG string.
 * @param {string} svg An SVG string.
 * @returns {Promise<string>} An optimized svg
 */
function processSvg(svg: string, path: string) {
  return (
    optimizeSvg(svg, path)
      .then(setAttrs)
      .then((optimizedSvg) => prettier.format(optimizedSvg, { parser: 'babel' }))
      // remove semicolon inserted by prettier
      // because prettier thinks it's formatting JSX not HTML
      .then((svg) => svg.replace(/;/g, ''))
  );
}

export default processSvg;
