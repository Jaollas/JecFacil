
import { Injectable } from '@angular/core';
import { GoogleGenAI } from "@google/genai";

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // The API key is sourced from environment variables as per guidelines.
    // Ensure `process.env.API_KEY` is available in your deployment environment.
    if (!process.env.API_KEY) {
      console.warn("API_KEY environment variable not set. Gemini features will be disabled.");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  }

  async getDigitalLawyerTip(stageName: string): Promise<string> {
    if (!process.env.API_KEY) {
      return this.getMockTip(stageName);
    }

    try {
      const prompt = `Aja como um 'advogado digital' amigável para um cidadão comum no Brasil, sem usar jargão jurídico. O processo dele está na fase de '${stageName}'. Forneça uma dica curta, tranquilizadora e prática sobre o que esperar ou como se preparar. A dica deve ter no máximo 3 frases. Responda em português do Brasil.`;
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text;
    } catch (error) {
      console.error('Error fetching tip from Gemini API:', error);
      return 'Não foi possível carregar a dica no momento. Lembre-se de sempre conversar com seu advogado(a) sobre qualquer dúvida.';
    }
  }

  private getMockTip(stageName: string): string {
    const mockTips: { [key: string]: string } = {
      'Início': 'Seu processo começou! Agora é só aguardar os próximos passos. Mantenha seus documentos organizados.',
      'Citação': 'A outra parte está sendo notificada oficialmente sobre o processo. Isso garante que todos tenham a chance de se defender.',
      'Audiência': 'Prepare-se para a audiência. Anote os pontos importantes que você quer falar e chegue com antecedência no dia.',
      'Sentença': 'O juiz(a) está analisando tudo para tomar uma decisão. Esta é uma fase importante que exige paciência.',
      'Finalizado': 'O processo chegou ao fim. Verifique a decisão final para saber os próximos passos, como o recebimento de valores ou o cumprimento de obrigações.'
    };
    return mockTips[stageName] || 'Mantenha a calma e confie no andamento do seu processo. Em caso de dúvidas, consulte seu advogado(a).';
  }
}
