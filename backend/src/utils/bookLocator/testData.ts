// testData.ts - Datos de prueba para el sistema de localización

import { LibraryStructure } from './types';
import { CodeParser } from './codeParser';

/**
 * Biblioteca de ejemplo completa para pruebas
 * Basada en la estructura descrita en el README
 */
export const sampleLibrary: LibraryStructure = {
  muebles: [
    {
      id: 1,
      nombre: 'Ciencias - Matemáticas y Física',
      range: {
        start: CodeParser.parse('500 A000A'),
        end: CodeParser.parse('599.999 Z999Z')
      },
      caras: [
        {
          tipo: 'frontal',
          range: {
            start: CodeParser.parse('500 A000A'),
            end: CodeParser.parse('549.999 Z999Z')
          },
          estanterias: [
            {
              id: 'A',
              range: {
                start: CodeParser.parse('510 A000A'),
                end: CodeParser.parse('519.999 Z999Z')
              },
              anaqueles: [
                {
                  numero: 1,
                  range: {
                    start: CodeParser.parse('511.33 A000A'),
                    end: CodeParser.parse('511.33 M999Z')
                  }
                },
                {
                  numero: 2,
                  range: {
                    start: CodeParser.parse('511.33 N000A'),
                    end: CodeParser.parse('511.33 Z999Z')
                  }
                },
                {
                  numero: 3,
                  range: {
                    start: CodeParser.parse('512 A000A'),
                    end: CodeParser.parse('519.999 Z999Z')
                  }
                }
              ]
            },
            {
              id: 'B',
              range: {
                start: CodeParser.parse('520 A000A'),
                end: CodeParser.parse('529.999 Z999Z')
              },
              anaqueles: [
                {
                  numero: 1,
                  range: {
                    start: CodeParser.parse('520 A000A'),
                    end: CodeParser.parse('524.999 Z999Z')
                  }
                },
                {
                  numero: 2,
                  range: {
                    start: CodeParser.parse('525 A000A'),
                    end: CodeParser.parse('529.999 Z999Z')
                  }
                }
              ]
            },
            {
              id: 'C',
              range: {
                start: CodeParser.parse('530 A000A'),
                end: CodeParser.parse('539.999 Z999Z')
              },
              anaqueles: [
                {
                  numero: 1,
                  range: {
                    start: CodeParser.parse('530 A000A'),
                    end: CodeParser.parse('530 Z999Z')
                  }
                },
                {
                  numero: 2,
                  range: {
                    start: CodeParser.parse('531 A000A'),
                    end: CodeParser.parse('539.999 Z999Z')
                  }
                }
              ]
            }
          ]
        },
        {
          tipo: 'trasera',
          range: {
            start: CodeParser.parse('550 A000A'),
            end: CodeParser.parse('599.999 Z999Z')
          },
          estanterias: [
            {
              id: 'D',
              range: {
                start: CodeParser.parse('550 A000A'),
                end: CodeParser.parse('559.999 Z999Z')
              },
              anaqueles: [
                {
                  numero: 1,
                  range: {
                    start: CodeParser.parse('550 A000A'),
                    end: CodeParser.parse('554.999 Z999Z')
                  }
                },
                {
                  numero: 2,
                  range: {
                    start: CodeParser.parse('555 A000A'),
                    end: CodeParser.parse('559.999 Z999Z')
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 2,
      nombre: 'Literatura Latinoamericana',
      range: {
        start: CodeParser.parse('C860 A000A'),
        end: CodeParser.parse('CR869.999 Z999Z')
      },
      caras: [
        {
          tipo: 'frontal',
          range: {
            start: CodeParser.parse('C860 A000A'),
            end: CodeParser.parse('C869.999 Z999Z')
          },
          estanterias: [
            {
              id: 'A',
              range: {
                start: CodeParser.parse('C863 A000A'),
                end: CodeParser.parse('C863 Z999Z')
              },
              anaqueles: [
                {
                  numero: 1,
                  range: {
                    start: CodeParser.parse('C863 A000A'),
                    end: CodeParser.parse('C863 M999Z')
                  }
                },
                {
                  numero: 2,
                  range: {
                    start: CodeParser.parse('C863 N000A'),
                    end: CodeParser.parse('C863 Z999Z')
                  }
                }
              ]
            }
          ]
        },
        {
          tipo: 'trasera',
          range: {
            start: CodeParser.parse('CR860 A000A'),
            end: CodeParser.parse('CR869.999 Z999Z')
          },
          estanterias: [
            {
              id: 'B',
              range: {
                start: CodeParser.parse('CR863 A000A'),
                end: CodeParser.parse('CR863 Z999Z')
              },
              anaqueles: [
                {
                  numero: 1,
                  range: {
                    start: CodeParser.parse('CR863 A000A'),
                    end: CodeParser.parse('CR863 M999Z')
                  }
                },
                {
                  numero: 2,
                  range: {
                    start: CodeParser.parse('CR863 N000A'),
                    end: CodeParser.parse('CR863 Z999Z')
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

/**
 * Biblioteca vacía para pruebas
 */
export const emptyLibrary: LibraryStructure = {
  muebles: []
};

/**
 * Biblioteca con un solo mueble para pruebas simples
 */
export const simplLibrary: LibraryStructure = {
  muebles: [
    {
      id: 1,
      nombre: 'Mueble Único',
      range: {
        start: CodeParser.parse('500 A000A'),
        end: CodeParser.parse('599.999 Z999Z')
      },
      caras: [
        {
          tipo: 'frontal',
          range: {
            start: CodeParser.parse('500 A000A'),
            end: CodeParser.parse('599.999 Z999Z')
          },
          estanterias: [
            {
              id: 'A',
              range: {
                start: CodeParser.parse('500 A000A'),
                end: CodeParser.parse('599.999 Z999Z')
              },
              anaqueles: [
                {
                  numero: 1,
                  range: {
                    start: CodeParser.parse('500 A000A'),
                    end: CodeParser.parse('599.999 Z999Z')
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
