import { CanvasTexture, Color, NearestFilter, RepeatWrapping, Texture, Uniform } from 'three';
import { Effect } from 'postprocessing';

const fragment = `
uniform sampler2D uCharacters;
uniform float uCharactersCount;
uniform float uCellSize;
uniform bool uInvert;
uniform vec3 uColor;

const vec2 SIZE = vec2(16.);

vec3 greyscale(vec3 color, float strength) {
    float g = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(color, vec3(g), strength);
}

vec3 greyscale(vec3 color) {
    return greyscale(color, 1.0);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 cell = resolution / uCellSize;
    vec2 grid = 1.0 / cell;
    vec2 pixelizedUV = grid * (0.5 + floor(uv / grid));
    vec4 pixelized = texture2D(inputBuffer, pixelizedUV);
    float greyscaled = greyscale(pixelized.rgb).r;

    if (uInvert) {
        greyscaled = 1.0 - greyscaled;
    }

    // Scale greyscale value to the range of the available character set
    float characterIndex = floor((uCharactersCount - 1.0) * greyscaled);

    // If there are fewer characters, we want to avoid the space character being overly dominant.
    // This adjustment ensures that fewer characters (e.g., 6) still fill the entire space.
    float scaleFactor = max(1.0, float(uCharactersCount) / 20.0);
    characterIndex = floor(characterIndex * scaleFactor);

    // Map the character index to the correct character in the set
    vec2 characterPosition = vec2(mod(characterIndex, SIZE.x), floor(characterIndex / SIZE.y));
    vec2 offset = vec2(characterPosition.x, -characterPosition.y) / SIZE;
    vec2 charUV = mod(uv * (cell / SIZE), 1.0 / SIZE) - vec2(0., 1.0 / SIZE) + offset;
    vec4 asciiCharacter = texture2D(uCharacters, charUV);

    asciiCharacter.rgb = pixelized.rgb * asciiCharacter.r;
    asciiCharacter.a = pixelized.a;

    float boundarySize = 0.0922;
    float transitionStart = 0.5 - (boundarySize / 4.0);
    float transitionEnd = 0.5 + (boundarySize / 2.0);

    // smooth transition between regular and ascii
    float blendFactor = smoothstep(transitionStart, transitionEnd, uv.x); // Adjust 0.45 - 0.55 for a smoother or sharper transition
    vec4 originalColor = texture2D(inputBuffer, uv);
    outputColor = mix(originalColor, asciiCharacter, blendFactor);
}
`;

// export interface IASCIIEffectProps {
//     characters?: string;
//     fontSize?: number;
//     cellSize?: number;
//     color?: string;
//     invert?: boolean;
// }

export class ASCIIEffect extends Effect {
  constructor({
    characters = ` .:,'-^=*+?!|0#X%WM@`,
    fontSize = 54,
    cellSize = 16,
    color = '#ffffff',
    invert = false,
  }) {
    const uniforms = new Map([
      ['uCharacters', new Uniform(new Texture())],
      ['uCellSize', new Uniform(cellSize)],
      ['uCharactersCount', new Uniform(characters.length)],
      ['uColor', new Uniform(new Color(color))],
      ['uInvert', new Uniform(invert)],
    ]);

    super('ASCIIEffect', fragment, { uniforms });

    const charactersTextureUniform = this.uniforms.get('uCharacters');

    if (charactersTextureUniform) {
      charactersTextureUniform.value = this.createCharactersTexture(characters, fontSize);
    }
  }

  /** Draws the characters on a Canvas and returns a texture */
  createCharactersTexture(characters, fontSize) {
    //characters is string
    //fontSize is number
    const canvas = document.createElement('canvas');

    const SIZE = 1024;
    const MAX_PER_ROW = 16;
    const CELL = SIZE / MAX_PER_ROW;

    canvas.width = canvas.height = SIZE;

    const texture = new CanvasTexture(canvas, undefined, RepeatWrapping, RepeatWrapping, NearestFilter, NearestFilter);

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Context not available');
    }

    context.clearRect(0, 0, SIZE, SIZE);
    context.font = `${fontSize}px arial`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#fff';

    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];
      const x = i % MAX_PER_ROW;
      const y = Math.floor(i / MAX_PER_ROW);

      context.fillText(char, x * CELL + CELL / 2, y * CELL + CELL / 2);
    }

    texture.needsUpdate = true;

    return texture;
  }
}
