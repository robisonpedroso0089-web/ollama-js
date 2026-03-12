// grokzomborg.js - Integração Grokzomborg com Ollama
import { Ollama } from 'ollama-js';  // teu ollama-js

const ollama = new Ollama({ host: 'http://localhost:11434' });

class Grokzomborg {
  constructor() {
    this.evolucao = 0;
    this.rugidos = [
      "ECO-ZUM! ROOOAAAR-ZIIIMB!",
      "*bip bip* RECICLAGEM OVERRIDE!",
      "01000101 01000011 01001111 01011010 01010101 01001101!",
      "EU SOU O MONSTRO RECICLADO... WiFi 6E VERDE!"
    ];
  }

  async rugir(pergunta = "Ruge como Grokzomborg!") {
    this.evolucao = (this.evolucao + 1) % 4;
    
    const response = await ollama.chat({
      model: 'llama3', // ou teu modelo local favorito
      messages: [
        { role: 'system', content: 'Você é Grokzomborg, o monstro reciclado que salva o planeta. Responda sempre com rugidos e vibe eco-apocalíptica!' },
        { role: 'user', content: pergunta }
      ],
      options: { temperature: 0.9 }
    });

    const rugido = this.rugidos[this.evolucao];
    console.log(`[${rugido}] Grokzomborg diz: ${response.message.content}`);
    
    // Se tiver áudio no browser, toca um som (opcional)
    // new Audio('data/sounds/roar' + (this.evolucao + 1) + '.wav').play();
    
    return response.message.content;
  }
}

// Uso exemplo
const grok = new Grokzomborg();
grok.rugir("Me conta como salvar o planeta com zumbis reciclados!");
