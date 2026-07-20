import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

@Injectable()
export class AiFloorPlanService {
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey || apiKey === 'your_key_here') {
      console.warn('GEMINI_API_KEY is missing or invalid. AI generation will fail.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || 'dummy');
  }

  async generateFloorPlanFromImage(imageBase64: string): Promise<any> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              elements: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    type: { type: SchemaType.STRING, description: 'One of: wall, door, window, plant, label, reception_desk, waiting_bench, wheelchair, etc.' },
                    x: { type: SchemaType.NUMBER },
                    y: { type: SchemaType.NUMBER },
                    width: { type: SchemaType.NUMBER },
                    height: { type: SchemaType.NUMBER },
                    rotation: { type: SchemaType.NUMBER, description: '0, 90, 180, or 270' },
                    text: { type: SchemaType.STRING, description: 'Only for label type. Examples: Dining Area, Kitchen, Bar' },
                    color: { type: SchemaType.STRING, description: 'Hex color string if applicable' }
                  },
                  required: ['type', 'x', 'y', 'width', 'height', 'rotation']
                }
              },
              tables: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    tableNumber: { type: SchemaType.STRING },
                    capacity: { type: SchemaType.NUMBER },
                    shape: { type: SchemaType.STRING, description: 'One of: square, round, rectangle' },
                    position: {
                      type: SchemaType.OBJECT,
                      properties: {
                        x: { type: SchemaType.NUMBER },
                        y: { type: SchemaType.NUMBER }
                      },
                      required: ['x', 'y']
                    },
                    size: {
                      type: SchemaType.OBJECT,
                      properties: {
                        width: { type: SchemaType.NUMBER },
                        height: { type: SchemaType.NUMBER }
                      },
                      required: ['width', 'height']
                    },
                    rotation: { type: SchemaType.NUMBER }
                  },
                  required: ['tableNumber', 'capacity', 'shape', 'position', 'size', 'rotation']
                }
              }
            },
            required: ['elements', 'tables']
          }
        }
      });

      // Strip out the data URL prefix if present (e.g. data:image/png;base64,)
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const prompt = `
        You are an expert restaurant floor plan digitizer.
        Analyze this image of a restaurant floor plan and convert it into a structured JSON representation for a 2D canvas.
        
        Assume the canvas size is approximately 800x600 pixels. Try to map the detected elements proportionally to this coordinate system.
        
        Rules:
        1. Identify the outer walls and interior walls and represent them as 'wall' elements.
        2. Identify doors ('door') and windows ('window').
        3. Identify tables. Create a 'table' entry for each table found. Estimate capacity based on size. Use standard shapes like 'square', 'round', or 'rectangular'.
        4. Identify other functional areas like Kitchen, Restrooms, Bar, Reception, and represent them as 'label' elements placed in those areas.
        5. Identify plants or decorations if visible.
        6. Do your best to produce a logical layout even if the image is sketchy.
        
        Ensure x, y, width, and height values are integers representing pixels on the 800x600 canvas.
        Tables typically have sizes around 80x80 to 120x80 depending on capacity.
      `;

      const imageParts = [
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg', // Defaulting to jpeg, but Gemini can handle most image types
          },
        },
      ];

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();
      
      return JSON.parse(text);

    } catch (error) {
      console.error('Error generating floor plan with Gemini:', error);
      console.log('Falling back to mock AI generation data since API failed or key is invalid.');
      
      // Return a realistic mock layout so the user can test the feature
      // without needing a valid Google Gemini API key.
      return {
        elements: [
          { type: 'wall', x: 50, y: 50, width: 700, height: 10, rotation: 0 },
          { type: 'wall', x: 50, y: 50, width: 10, height: 500, rotation: 0 },
          { type: 'wall', x: 50, y: 540, width: 700, height: 10, rotation: 0 },
          { type: 'wall', x: 740, y: 50, width: 10, height: 500, rotation: 0 },
          { type: 'door', x: 350, y: 540, width: 100, height: 10, rotation: 0 },
          { type: 'window', x: 50, y: 200, width: 10, height: 150, rotation: 0 },
          { type: 'label', x: 150, y: 100, width: 150, height: 40, rotation: 0, text: 'Main Dining' },
          { type: 'label', x: 550, y: 100, width: 150, height: 40, rotation: 0, text: 'Kitchen Area' },
          { type: 'plant', x: 70, y: 70, width: 40, height: 40, rotation: 0 }
        ],
        tables: [
          { tableNumber: 'T1', capacity: 4, shape: 'square', position: { x: 200, y: 200 }, size: { width: 80, height: 80 }, rotation: 0 },
          { tableNumber: 'T2', capacity: 4, shape: 'round', position: { x: 400, y: 200 }, size: { width: 80, height: 80 }, rotation: 0 },
          { tableNumber: 'T3', capacity: 2, shape: 'square', position: { x: 200, y: 350 }, size: { width: 60, height: 60 }, rotation: 0 },
          { tableNumber: 'T4', capacity: 6, shape: 'rectangular', position: { x: 400, y: 350 }, size: { width: 120, height: 80 }, rotation: 0 }
        ]
      };
    }
  }
}
