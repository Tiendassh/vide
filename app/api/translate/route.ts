import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Helper function to generate dynamic, realistic, synchronized subtitles when API key is not configured
function generateDynamicSubtitles(title: string, description: string, author: string, category: string) {
  const cleanTitle = title.replace(/[^\w\sñáéíóúÁÉÍÓÚ]/gi, '');
  const cleanAuthor = author || 'Canal';
  const cleanCategory = category || 'General';
  const cleanDescSnippet = description && description.length > 50 
    ? description.substring(0, 50) + "..." 
    : (description || 'detalles del contenido');

  return [
    {
      start: 1.0,
      end: 8.0,
      original: `Welcome back to the channel! Today we are diving deep into "${cleanTitle}".`,
      spanish: `¡Bienvenidos de nuevo al canal! Hoy nos sumergiremos a fondo en "${cleanTitle}".`
    },
    {
      start: 11.0,
      end: 18.0,
      original: `This video is brought to you by ${cleanAuthor}, exploring the ${cleanCategory} category.`,
      spanish: `Este video llega a ustedes gracias a ${cleanAuthor}, explorando la categoría ${cleanCategory}.`
    },
    {
      start: 22.0,
      end: 30.0,
      original: `Let's talk about the main context: ${cleanDescSnippet}.`,
      spanish: `Hablemos sobre el contexto principal: ${cleanDescSnippet}.`
    },
    {
      start: 34.0,
      end: 42.0,
      original: `We have been preparing this special demonstration for a long time.`,
      spanish: `Hemos estado preparando esta demostración especial durante mucho tiempo.`
    },
    {
      start: 46.0,
      end: 54.0,
      original: `Pay close attention to how these elements interact with each other.`,
      spanish: `Presten mucha atención a cómo interactúan estos elementos entre sí.`
    },
    {
      start: 58.0,
      end: 66.0,
      original: `This is particularly useful when you need to optimize workflows.`,
      spanish: `Esto es particularmente útil cuando se necesitan optimizar los flujos de trabajo.`
    },
    {
      start: 70.0,
      end: 78.0,
      original: `Let's pause here and check the main highlights of this step.`,
      spanish: `Hagamos una pausa aquí y revisemos los aspectos más destacados de este paso.`
    },
    {
      start: 82.0,
      end: 90.0,
      original: `As we proceed, you can see the progressive results forming.`,
      spanish: `A medida que avanzamos, pueden ver cómo se van formando los resultados progresivos.`
    },
    {
      start: 94.0,
      end: 102.0,
      original: `Many professionals and enthusiasts prefer this approach because of its efficiency.`,
      spanish: `Muchos profesionales y entusiastas prefieren este enfoque debido a su eficiencia.`
    },
    {
      start: 106.0,
      end: 114.0,
      original: `If you want to read more details, the description contains useful links.`,
      spanish: `Si desean leer más detalles, la descripción contiene enlaces útiles.`
    },
    {
      start: 118.0,
      end: 126.0,
      original: `Let me know in the comments section if you have any questions.`,
      spanish: `Déjenme saber en la sección de comentarios si tienen alguna pregunta.`
    },
    {
      start: 130.0,
      end: 138.0,
      original: `We are reaching the advanced phase of today's review.`,
      spanish: `Estamos llegando a la fase avanzada de la revisión de hoy.`
    },
    {
      start: 142.0,
      end: 150.0,
      original: `Make sure to implement these configurations carefully.`,
      spanish: `Asegúrense de implementar estas configuraciones con cuidado.`
    },
    {
      start: 154.0,
      end: 162.0,
      original: `I hope you found this guide highly valuable and interesting.`,
      spanish: `Espero que esta guía les haya resultado muy valiosa e interesante.`
    },
    {
      start: 166.0,
      end: 172.0,
      original: `Don't forget to like this video and subscribe for more content!`,
      spanish: `¡No olviden darle me gusta a este video y suscribirse para más contenido!`
    },
    {
      start: 175.0,
      end: 180.0,
      original: `Thanks for watching, and I will see you in the next one. Goodbye!`,
      spanish: `Gracias por ver, y los veré en el próximo. ¡Hasta luego!`
    }
  ];
}

export async function POST(req: NextRequest) {
  let title = "";
  let description = "";
  let author = "";
  let category = "";

  try {
    const body = await req.json();
    title = body.title || "";
    description = body.description || "";
    author = body.author || "";
    category = body.category || "";

    if (!title) {
      return NextResponse.json(
        { success: false, error: "El título del video es requerido." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isApiKeyConfigured = apiKey && 
                               apiKey.trim() !== "" && 
                               apiKey !== "MY_GEMINI_API_KEY" && 
                               apiKey !== "YOUR_GEMINI_API_KEY";

    if (!isApiKeyConfigured) {
      // Return dynamic simulated translation when API key is not present/configured
      const simulatedSubtitles = generateDynamicSubtitles(title, description, author, category);
      return NextResponse.json({
        success: true,
        detectedLanguage: "Inglés (Simulado - Configura GEMINI_API_KEY)",
        confidence: 1.0,
        originalTitleTranslation: title,
        subtitles: simulatedSubtitles,
        note: "Para traducción real por Inteligencia Artificial, configura tu clave en Settings > Secrets de Google AI Studio."
      });
    }

    // Initialize Gemini SDK safely with the valid API key
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `Analiza la información de este video:
Título: "${title}"
Autor/Canal: "${author || 'Desconocido'}"
Categoría: "${category || 'General'}"
Descripción: "${description || 'Sin descripción'}"

Por favor:
1. Identifica el idioma original en el que probablemente esté hablado este video (por ejemplo, "Inglés", "Portugués", "Francés", "Japonés", "Español", "Alemán", etc.).
2. Genera una lista de subtítulos secuenciales y realistas sincronizados en tiempo (de 0 a 180 segundos). Deben ser de 12 a 15 entradas espaciadas de forma natural (cada 10-15 segundos). Cada subtítulo debe simular lo que se diría en un video con este título y descripción.
3. Para cada subtítulo, proporciona la frase en el idioma original detectado ("original") y su traducción precisa al español ("spanish"). Si el idioma original ya es "Español", la versión original y la de español serán idénticas o transcripciones mejoradas en español.
4. Traduce también el título del video al español si originalmente no lo está, en el campo "originalTitleTranslation".`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Eres un experto traductor de videos y generador de subtítulos profesionales. Tu trabajo es identificar el idioma original y producir subtítulos de alta fidelidad con traducciones perfectas y fluidas únicamente al español.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguage: {
              type: Type.STRING,
              description: "El idioma original detectado del video (por ejemplo, 'Inglés', 'Portugués', 'Alemán', 'Español')."
            },
            confidence: {
              type: Type.NUMBER,
              description: "El nivel de confianza en la detección de idioma (entre 0.0 y 1.0)."
            },
            originalTitleTranslation: {
              type: Type.STRING,
              description: "La traducción al español del título del video si es que no estaba en español."
            },
            subtitles: {
              type: Type.ARRAY,
              description: "Lista ordenada de subtítulos temporizados.",
              items: {
                type: Type.OBJECT,
                properties: {
                  start: {
                    type: Type.NUMBER,
                    description: "Tiempo de inicio en segundos desde el inicio del video."
                  },
                  end: {
                    type: Type.NUMBER,
                    description: "Tiempo de fin en segundos desde el inicio del video."
                  },
                  original: {
                    type: Type.STRING,
                    description: "La frase hablada simulada en el idioma original."
                  },
                  spanish: {
                    type: Type.STRING,
                    description: "La traducción de esa frase al idioma español."
                  }
                },
                required: ["start", "end", "original", "spanish"]
              }
            }
          },
          required: ["detectedLanguage", "confidence", "originalTitleTranslation", "subtitles"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("La respuesta del modelo de traducción está vacía.");
    }

    const data = JSON.parse(resultText.trim());
    return NextResponse.json({
      success: true,
      ...data
    });

  } catch (error: any) {
    console.error("Error en el API de traducción de video:", error);
    // If the real API call fails (e.g. invalid key, quota, etc.), we fall back to simulated to prevent app crash, but log the issue
    const simulatedSubtitles = generateDynamicSubtitles(title || "Video", description, author, category);
    return NextResponse.json({
      success: true,
      detectedLanguage: "Inglés (Simulado por Error en API Key)",
      confidence: 0.5,
      originalTitleTranslation: title || "Video",
      subtitles: simulatedSubtitles,
      note: `Error de API de Gemini: ${error.message || "Fallo en la llamada"}. Se muestran subtítulos simulados.`
    });
  }
}
